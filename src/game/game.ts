import { input, select } from "@inquirer/prompts";
import fs from "fs";
import { select as multi } from "inquirer-select-pro";
import { load } from "js-yaml";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { logMessage, MAX_PLAYERS, RANK_COUNT, SKIP_ROUND } from "./common.ts";
import { Deck } from "./deck.js";
import { Hand } from "./hand.js";
import { Card } from "./card.ts";
import { Player } from "./player.js";

/* HELPER METHODS */
const logMove = (message) => {
  console.log(` ---- ${message} ---- `);
};

const promptUserAtStart = async (entry) => {
  const userInputs = {};
  const regex = /\$\{placeholder\}/i;
  for (const idx in entry) {
    const obj = entry[idx];
    const prompt = obj["Prompt"];
    const choices = obj["Choices"];
    const response = obj["Response"];
    const variableName = obj["Variable"];
    let result: string[] = [];

    if (prompt) {
      if (choices) {
        result = await select({
          message: prompt,
          choices: choices.split(",").map((c) => {
            return {
              name: c,
              value: c,
              definition: c,
            };
          }),
        });
      } else {
        await input({ message: prompt }).then((answer) => {
          handleUserInput(response, regex, variableName, answer);
          result = answer.split(",").join("").split(" ");
        });
      }
    }

    userInputs[variableName] = result;
  }
  return userInputs;
};

const promptUserDuringGame = async (player: Player, lastHandPlayed: Hand | undefined) => {
  if (player.isComputer) {
    return;
  }

  const options = [{ name: SKIP_ROUND, value: SKIP_ROUND }].concat(
    player.hand.cards.map((c) => {
      return { name: c.toString(), value: c.toString() };
    })
  );

  const selectedCards = await multi({
    message: "What would you like to do or play?",
    multiple: true,
    options: options,
  });

  if (selectedCards.find((s) => s === SKIP_ROUND)) {
    player.skipRound();
    return;
  }

  const combo = player.hand.cards.filter((c) =>
    selectedCards.includes(c.toString())
  );

  const { validCombo, comboPlayed, error } = player.playCombo(new Hand(combo), lastHandPlayed);
  if (!validCombo) {
    logMessage(
      `${player.name} played an invalid combo (err: ${error}). Try again.`
    );
    await promptUserDuringGame(player, lastHandPlayed);
  }
  if (comboPlayed && lastHandPlayed) {
    if (comboPlayed.cards.length !== lastHandPlayed.cards.length) {
      logMessage(
        `${player.name} played cards that don't match the number of cards in the last hand played. The hand to beat is ${lastHandPlayed.toString()} Try again.`
      );
      await promptUserDuringGame(player, lastHandPlayed);
    }
    if (!comboPlayed.beats(lastHandPlayed)) {
      logMessage(
        `${player.name} played a combo that doesn't beat the last hand played. Try again.`
      );
    }
    await promptUserDuringGame(player, lastHandPlayed);
  }
  return comboPlayed;
};

const handleUserInput = (response, regex, variableName, answer) => {
  if (variableName == "playerNames") {
    console.log(response.replace(regex, answer.replace(", ", " + ")));
  } else {
    console.log(response.replace(regex, answer));
  }
};

export class Game {
  players;
  deck;

  constructor(players = [], deck = new Deck()) {
    if (players.length < 5) {
      this.players = players;
    }
    if (deck.cards.length >= 52) {
      this.deck = deck;
    }
  }

  importScript() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const path = resolve(__dirname, "./script.yaml");
    const script = fs.readFileSync(path, "utf8");
    return load(script);
  }

  async initialize() {
    let userInputs = {};

    for (const [_, entry] of Object.entries(this.importScript())) {
      if (typeof entry !== "string") {
        userInputs = await promptUserAtStart(entry);
      }
    }

    const playerCount = userInputs["playerCount"];
    const players = userInputs["playerNames"];

    // ensure the expected players matches
    if (
      parseInt(playerCount) !== players.length ||
      players.length > MAX_PLAYERS
    ) {
      this.restart(
        "The number of players doesn't match the number of names. Try again."
      );
    } else if (players.filter((p) => p.length < 1).length > 0) {
      this.restart("Empty names are not allowed. Try again.");
    } else if (playerCount > 1) {
      logMessage("Multi-player is not currently supported.");
    } else {
      this.start(players);
    }
  }

  start(players) {
    // set up the live players
    players.forEach((p) => {
      const player = new Player(this.#getHand(), p, false);
      this.addPlayer(player);
    });
    // set up the computer players
    const computerPlayers = MAX_PLAYERS - players.length;
    for (let i = 0; i < computerPlayers; i++) {
      this.addPlayer();
    }

    this.startRound();
  }

  isGameOver() {
    // game ends when a single player has finished all their cards
    this.players.forEach((p) => {
      p.calculateCombos();
    });
    const winners = this.players.filter((p) => p.hand.cards.length === 0);
    winners.map((w) => {
      logMessage(`The game has ended! ${w} is the winner!`);
    })
    return winners.length > 0;
  }

  restart(message) {
    if (message.length > 0) {
      logMessage(message);
    }
    this.initialize();
  }

  addPlayer(player = new Player(this.#getHand())) {
    if (this.players.length < 5) {
      this.players.push(player);
      return player;
    }
  }

  playerOrder({ lastPlayer }): Player[] {
    if (lastPlayer === undefined || lastPlayer.length === 0) {
      return this.players;
    }
    const firstPlayer: Player[] = this.players.filter((p) => p.name === lastPlayer)
    return firstPlayer.concat(this.players.filter((p) => p.name !== lastPlayer))
  }

  async startRound() {
    const stats: { lastPlayer: string, lastHandPlayed: Hand | undefined } = {
      lastPlayer: "",
      lastHandPlayed: undefined,
    };

    const [winner] = this.players
      .filter((p) => p.hand.cards.length === 0)
      .map((p) => p.name);
    while (!this.isGameOver()) {
      for (const player of this.playerOrder(stats)) {
        this.updateStats(stats, player)
        if (player.skip) {
          continue;
        }
        logMove(
          `${player.name} is playing their turn${stats.lastPlayer.length > 0 ? ` after ${stats.lastPlayer}` : ``
          }!`
        );
        if (!player.isComputer) {
          // display available combos to user
          player.logCombos(stats.lastHandPlayed)
          stats.lastHandPlayed = await promptUserDuringGame(player, stats.lastHandPlayed);
        } else {
          const computerResult = player.autoPlay(stats.lastHandPlayed);
          // i.e. the computer couldn't beat the last hand
          if (!computerResult) {
            player.skipRound();
            continue;
          }
          stats.lastHandPlayed = computerResult.comboPlayed;
          if (computerResult.comboPlayed) {
            computerResult.comboPlayed.toString()
          }
        }
        stats.lastPlayer = player.name;
      }
    }
  }

  updateStats(stats, player: Player) {
    if (stats.lastPlayer == player.name) {
      const winner = player.name
      stats.lastPlayer = "";
      stats.lastHandPlayed = undefined;
      this.resetRound(winner);
    }
  }

  resetRound(winner = "") {
    logMessage(`The round is over, ${winner} won! Time for the next round...`)
    this.players.forEach((p) => p.resetRound());
  }

  #getHand() {
    let i = 0;
    let cards: Card[] = [];

    while (i < RANK_COUNT && this.deck.cards.length > 0) {
      let randCard = Math.floor(Math.random() * this.deck.cards.length);
      const [card] = this.deck.cards.splice(randCard, 1);
      cards.push(card);
      i++;
    }
    return new Hand(cards);
  }
}

const game = new Game();
game.initialize();
