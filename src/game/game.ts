import { input, select } from "@inquirer/prompts";
import { Table } from "console-table-printer";
import fs from "fs";
import { select as multi } from "inquirer-select-pro";
import { load } from "js-yaml";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { DECK_SIZE, logMessage, MAX_PLAYERS, SKIP_ROUND } from "./common.ts";
import { Deck } from "./deck.js";
import { Hand } from "./hand.js";
import { Player } from "./player.js";
import { isEmpty } from "underscore";

/* HELPER METHODS */
const logMove = (message: string) => {
  console.log(` ---- ${message} ---- `);
};

const promptUserAtStart = async (entry: any) => {
  const userInputs: { [key: string]: string } = {};
  const regex = /\$\{placeholder\}/i;
  for (const idx in entry) {
    const obj = entry[idx];
    const prompt = obj["Prompt"];
    const choices = obj["Choices"];
    const response = obj["Response"];
    const variableName = obj["Variable"];
    let result: string = "";

    if (prompt) {
      if (choices) {
        result = await select({
          message: prompt,
          choices: choices.split(",").map((c: string) => {
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
          result = answer.split(",").join("");
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

  const cardsToDisplay = lastHandPlayed ? player.eligibleMoves(lastHandPlayed) : player.hand.cards.map((c) => c.toString())
  const options = [{ name: SKIP_ROUND, value: SKIP_ROUND }].concat(
    cardsToDisplay.map((c) => {
      return { name: c, value: c };
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
  if (!validCombo || error.length > 0) {
    logMessage(
      `${player.name} played an invalid combo (err: ${error}). Try again.`
    );
    await promptUserDuringGame(player, lastHandPlayed);
  } else {
    if (comboPlayed && lastHandPlayed) {
      if (comboPlayed.cards.length !== lastHandPlayed.cards.length) {
        logMessage(
          `${player.name} played cards that don't match the number of cards in the last hand played (${lastHandPlayed.cards.length}). The hand to beat is ${lastHandPlayed.toString()} Try again.`
        );
        await promptUserDuringGame(player, lastHandPlayed);
      }
      if (!comboPlayed.beats(lastHandPlayed)) {
        logMessage(
          `${player.name} played a combo that doesn't beat the last hand played (${lastHandPlayed.toString()}). Try again.`
        );
        await promptUserDuringGame(player, lastHandPlayed);
      }
    }
    if (comboPlayed && validCombo && (!lastHandPlayed || comboPlayed.beats(lastHandPlayed))) {
      player.removeCards(comboPlayed);
    }
    return comboPlayed;
  }
};

const handleUserInput = (response: string, regex: RegExp, variableName: string, answer: string) => {
  if (variableName == "playerNames") {
    console.log(response.replace(regex, answer.replace(", ", " + ")));
  } else {
    console.log(response.replace(regex, answer));
  }
};

// TODO: Ensure 3 of Diamonds starts the game
// TODO: Ensure round continues until the player can go again
export class Game {
  players: Player[];
  deck: Deck;

  constructor(players = [], deck = new Deck()) {
    if (players.length > 4 || deck.cards.length < 52 || deck.cards.length > 54) {
      throw new Error("Invalid number of players or cards for this game")
    }
    this.players = players;
    this.deck = deck;
  }

  importScript(): any {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const path = resolve(__dirname, "./script.yaml");
    const script = fs.readFileSync(path, "utf8");
    return load(script);
  }

  async initialize() {
    let userInputs: { [key: string]: string } = {};

    for (const [_, entry] of Object.entries(this.importScript())) {
      if (typeof entry !== "string") {
        userInputs = await promptUserAtStart(entry);
      }
    }

    const playerCount: number = parseInt(userInputs["playerCount"]);
    const players: string[] = userInputs["playerNames"].split(" ");

    // ensure the expected players matches
    if (
      playerCount !== players.length ||
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

  start(players: string[]) {
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
    const winners = this.players.filter((p) => p.hand.cards.length === 0).map(p => p.name);
    winners.map((w) => {
      logMessage(`The game has ended! ${w} is the winner!`);
    })
    this.logGameState();
    return winners.length > 0;
  }

  logGameState() {
    if (this.players.map(p => p.hand.cards.length).reduce((a, b) => Math.min(a, b)) > 5) {
      return;
    }
    const table = new Table({ columns: [{ name: "player" }, { name: "cards_left", color: "red" }], defaultColumnOptions: { alignment: "center" }, rows: this.players.map((p) => { return { player: p.name, cards_left: p.hand.cards.length } }) });
    table.printTable()
  }

  restart(message: string) {
    if (!isEmpty(message)) {
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

  playerOrder(stats: { lastPlayer: string }): Player[] {
    const { lastPlayer } = stats
    if (lastPlayer === undefined || lastPlayer.length === 0) {
      return this.players;
    }
    const firstPlayer: Player[] = this.players.filter((p) => p.name === lastPlayer)
    return firstPlayer.concat(this.players.filter((p) => p.name !== lastPlayer))
  }

  async startRound() {
    const stats: { lastPlayer: string, lastHandPlayed: Hand | undefined, roundOver: boolean } = {
      lastPlayer: "",
      lastHandPlayed: undefined,
      roundOver: false
    };

    while (!this.isGameOver()) {
      for (const player of this.playerOrder(stats)) {
        this.updateStats(stats, player)
        if (player.skip) {
          continue;
        }

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

          if (computerResult.comboPlayed && computerResult.validCombo && (!stats.lastHandPlayed || computerResult.comboPlayed.beats(stats.lastHandPlayed))) {
            stats.lastHandPlayed = computerResult.comboPlayed;
            player.removeCards(computerResult.comboPlayed);
            computerResult.comboPlayed.toString()
          }
        }
        if (!player.skip) {
          logMove(
            `${player.name} is taking their turn${!isEmpty(stats.lastPlayer) ? ` after ${stats.lastPlayer}` : ``
            }! They played a ${stats.lastHandPlayed?.type.replace("_", " ")}.`
          );
        }
        stats.lastHandPlayed?.logMove()
        stats.lastPlayer = player.name;
      }
    }
  }

  updateStats(stats: any, player: Player) {
    if (stats.lastPlayer == player.name) {
      const winner = player.name
      stats.lastPlayer = "";
      stats.lastHandPlayed = undefined;
      stats.roundOver = true
      this.resetRound(winner);
    }
    stats.roundOver = false
  }

  resetRound(winner = "") {
    logMessage(`The round is over, ${winner} won! Time for the next round...`)
    this.players.forEach((p) => p.resetRound());
  }

  #getHand(): Hand {
    if (!this.deck || !this.deck.cards) {
      throw new Error("Game cannot begin without a valid hand")
    }
    const cardCount = Math.round(DECK_SIZE / MAX_PLAYERS)
    const cards = this.deck.cards.splice(0, cardCount)
    return new Hand(cards);
  }
}

const game = new Game();
game.initialize();
