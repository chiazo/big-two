import fs from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { MAX_PLAYERS, logMessage, RANK_COUNT } from "./contants.js";
import { Deck } from "./deck.js";
import { Hand } from "./hand.js";
import { Player } from "./player.js";
import { load } from "js-yaml";
import { input, select } from "@inquirer/prompts";
import { select as multi } from "inquirer-select-pro";

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
    let result = "";

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

const promptUserDuringGame = async (player) => {
  const selectedCards = await multi({
    message: "What combo do you wish to play?",
    multiple: true,
    options: player.hand.cards.map((c) => {
      return { name: c.toString(), value: c.toString() };
    }),
  });

  const combo = player.hand.cards.filter((c) =>
    selectedCards.includes(c.toString())
  );

  const { validCombo, comboPlayed, error } = player.playCombo(new Hand(combo));
  if (!validCombo) {
    logMessage(
      `${player.name} played an invalid combo (err: ${error}). Try again.`
    );
    await promptUserDuringGame(player);
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
    for (let i = 0; i <= computerPlayers; i++) {
      this.addPlayer();
    }
    this.startRound();
    this.isGameOver();
  }

  isGameOver() {
    // game ends when a single player has finished all their cards
    this.players.forEach((p) =>
      console.log(`\n${p.name} has ${p.hand.cards.length} left`)
    );
    return this.players.some((p) => p.hand.cards.length === 0);
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

  async startRound() {
    let lastComboPlayed;
    let lastPlayer;
    for (const player of this.players) {
      logMove(
        `${player.name} is playing their turn${
          lastPlayer !== null ? ` after ${lastPlayer}` : ``
        }!`
      );
      if (!player.isComputer) {
        lastComboPlayed = await promptUserDuringGame(player);
      } else {
        let { comboPlayed } = player.autoPlay(lastComboPlayed);
        lastComboPlayed = comboPlayed;
      }

      lastPlayer = player.name;
    }
  }

  #getHand() {
    let i = 0;
    let cards = [];

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
