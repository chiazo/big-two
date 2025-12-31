import fs from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { MAX_PLAYERS, SEPARATOR, RANK_COUNT } from "./contants.js";
import { Deck } from "./deck.js";
import { Hand } from "./hand.js";
import { Player } from "./player.js";
import { load } from "js-yaml";
import { input, select } from "@inquirer/prompts";

const logMessage = (message) => {
  console.log(SEPARATOR + message + SEPARATOR);
};

const promptUser = async (entry) => {
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
        userInputs = await promptUser(entry);
      }
    }

    const playerCount = userInputs["playerCount"];
    const players = userInputs["playerNames"];

    // ensure the expected players matches
    if (parseInt(playerCount) !== MAX_PLAYERS - players.length) {
      logMessage(
        "The number of players doesn't match the number of names. Try again."
      );
      this.initialize();
    } else {
      this.start(players);
    }
  }

  start(players) {
    // set up the live players
    players.forEach((p) => {
      const player = new Player(this.#getHand(), p);
      console.log(this.addPlayer(player));
    });
    // set up the computer players
    const computerPlayers = MAX_PLAYERS - players.length;
    for (let i = 0; i < computerPlayers; i++) {
      console.log(this.addPlayer());
    }
  }

  addPlayer(player = new Player(this.#getHand())) {
    if (this.players.length < 5) {
      this.players.push(player);
      return player;
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
// for (let i = 1; i < 5; i++) {
//   game.addPlayer().getHand();
// }

game.initialize();
