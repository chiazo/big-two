import fs from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { RANK_COUNT } from "./contants.js";
import { Deck } from "./deck.js";
import { Hand } from "./hand.js";
import { Player } from "./player.js";
import { load } from "js-yaml";
import { input, select } from "@inquirer/prompts";

const promptUser = async (entry) => {
  const regex = /\$\{placeholder\}/i;
  for (const idx in entry) {
    const obj = entry[idx];
    const prompt = obj["Prompt"];
    const choices = obj["Choices"];
    const response = obj["Response"];

    if (prompt) {
      if (choices) {
        await select({
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
        await input(
          { message: prompt },
          { signal: AbortSignal.timeout(4000) }
        ).then((answer) => handleUserInput(response, regex, answer));
      }
    }
  }
};

const handleUserInput = (response, regex, answer) => {
  console.log(response.replace(regex, answer));
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

  startGame() {
    const script = this.importScript();

    Object.entries(script).forEach((part) =>
      part.forEach((entry) => {
        if (typeof entry !== "string") {
          promptUser(entry);
        }
      })
    );
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

game.startGame();
