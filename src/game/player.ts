import { Card } from "./card.ts";
import {
  buildNonSequentialCombos,
  calculateHandCount,
  CardCombo,
  COMBOS,
  FullHandCombo,
  getMaxHand,
  getMaxRank,
  logMessage,
  MAX_PLAYABLE_CARDS,
  SEPARATOR,
  sortByRank,
  sortHands,
} from "./common.ts";
import { Hand } from "./hand.js";
import { Table } from "console-table-printer";
export class SubCombo {
  rank: string;
  hand: Hand;
  type: string;
  constructor(rank = '', hand, type) {
    this.rank = rank;
    this.hand = hand;
    this.type = type;
  }

  // returns the best cards of the rank
  best(rank: string, count: number = 1): Card[] {
    return this.hand.cards.filter((c) => c.rank == parseInt(rank)).sort(sortByRank).slice(count * -1)
  }
}

export class Player {
  static RANDOM_NAMES = ["Obi", "Toby", "Adanna", "Nneoma", "Kamsi"];
  name: string;
  hand: Hand;
  combos: { [key in COMBOS]?: SubCombo[] };
  skip: boolean;
  isComputer: boolean;

  constructor(hand: Hand, name: string = this.randomName(), isComputer: boolean = true) {
    this.hand = hand;
    this.name = name;
    this.isComputer = isComputer;
    this.skip = false;
  }

  cards() {
    return this.hand.cards;
  }

  randomName() {
    const index = Math.floor(Math.random() * Player.RANDOM_NAMES.length);
    const name = Player.RANDOM_NAMES[index];
    Player.RANDOM_NAMES = Player.RANDOM_NAMES.filter((n) => n !== name);
    return name;
  }

  playCombo(combo: Hand, lastHandPlayed: Hand | undefined) {
    const cardCount =
      lastHandPlayed !== undefined ? lastHandPlayed.cards.length : Math.max(combo.cards.length, 1);
    const minCardsRequired = Math.min(cardCount, MAX_PLAYABLE_CARDS);
    const [existingCardCombo] = Object.values(CardCombo).filter(
      (cc) => cc.count == combo.cards.length
    );

    if (existingCardCombo === undefined) {
      return {
        validCombo: false,
        comboPlayed: undefined,
        error: "the number of cards selected is invalid",
      };
    }
    if (!existingCardCombo.isValid(combo)) {
      return {
        validCombo: false,
        comboPlayed: undefined,
        error: "the given card combo is invalid",
      };
    }

    if (
      combo.cards.length < minCardsRequired ||
      combo.cards.length > MAX_PLAYABLE_CARDS
    ) {
      return {
        validCombo: false,
        comboPlayed: undefined,
        error: "the card count is too little or too high",
      };
    }

    return {
      validCombo: true,
      comboPlayed: combo,
      error: ""
    };
  }

  removeCards(combo) {
    const mapping = combo.cards.map((c) => c.toString());
    this.hand.cards = this.cards().filter(
      (c) => !mapping.includes(c.toString())
    );
  }

  autoPlay(lastHandPlayed: Hand | undefined) {
    if (!this.isComputer) {
      return;
    }
    this.calculateCombos();
    return this.playBestHand(lastHandPlayed);
  }

  skipRound() {
    if (this.skip) {
      return;
    }
    this.skip = true;
    console.log(`${this.name} skipped their turn.`)
  }

  resetRound() {
    this.skip = false;
  }

  playBestHand(lastHandPlayed: Hand | undefined) {
    const isRoundLeader = lastHandPlayed == undefined;

    const bestCombo = Object.keys(this.combos).reverse().find(k => this.combos[k].length > 0)
    const bestComboValues = bestCombo ? this.combos[bestCombo] : []
    const bestHandOverall = bestComboValues.sort((a: SubCombo, b: SubCombo) => sortHands(a.hand, b.hand)).pop()?.hand
    const bestHandForRound = isRoundLeader ? bestHandOverall : this.bestHand(lastHandPlayed.type);

    // skip if you don't have a hand for this round
    if (!bestHandForRound) {
      this.skipRound();
      return;
    }

    // skip if you can't beat the last hand played
    if (!isRoundLeader && !bestHandForRound.beats(lastHandPlayed)) {
      this.skipRound();
      return;
    }

    const result = this.playCombo(bestHandForRound, lastHandPlayed);
    if (!result.validCombo || !result.comboPlayed) {
      logMessage(`Uh oh! ${this.name} played an invalid combo`);
    }
    return result;
  }

  bestHand(type) {
    const availableMoves = this.combos[type];
    if (!availableMoves || availableMoves.length == 0) {
      return;
    }
    if (type === COMBOS.FULL_HAND) {
      return availableMoves.map((c) => c.hand).reduce(getMaxHand);
    }
    const maxRank = parseInt(
      availableMoves.map(({ rank }) => rank).reduce(getMaxRank)
    );
    const cards = this.hand.cards
      .filter((c) => c.rank === maxRank)
      .slice(0, CardCombo[type].count);
    return new Hand(cards);
  }

  eligibleMoves(lastComboPlayed: Hand) {
    const keys = Object.keys(this.combos).filter((k) => lastComboPlayed.type == k)
    return keys.reduce((prev, curr) => prev.concat(this.combos[curr].map((cl) => cl.hand.cards.map(c => c.toString()))), []).flat()
  }

  logCombos(lastComboPlayed: Hand | undefined) {
    console.log(`\n ---- The combos you have available are: ---- `);
    let keys = Object.keys(this.combos)
    if (lastComboPlayed) {
      keys = keys.filter((k) => lastComboPlayed.type == k)
    }

    const rows = keys.filter(k => this.combos[k].length > 0).map(k => {
      return {
        combo: [... new Set(this.combos[k].map(s => s.type))].pop(), hands: this.combos[k].map(
          (v) =>
            v.rank ||
            v.hand.toString()
        )
      }
    });
    const table = new Table({ columns: [{ name: "combo", color: "yellow" }, { name: "hands", color: "green" }], defaultColumnOptions: { alignment: "center" }, rows: rows });
    if (rows.length > 0) {
      table.printTable()
    } else {
      console.log("Dang, you don't have any eligible moves for this round!")
    }
    console.log(SEPARATOR);
  }

  calculateCombos() {
    const singleCombos = this.getSingleCombos()
    const combos = {
      [COMBOS.SINGLE]: singleCombos,
      [COMBOS.PAIR]: this.getPairCombos(),
      [COMBOS.TRIPLE]: this.getTripleCombos(),
    };

    const currResultHelp = this.getFullHandCombos(combos)
    combos[COMBOS.FULL_HAND] = currResultHelp
    this.combos = combos;
  }

  getSingleCombos(): SubCombo[] {
    const handCount = calculateHandCount(this.hand);
    const singles: SubCombo[] = Object.entries(handCount)
      .filter(([, count]) => count === 1)
      .map(([rank]) => {
        return new SubCombo(rank, new Hand(this.hand.cards.filter((c) => c.rank === parseInt(rank))), COMBOS.SINGLE);
      });

    return singles;
  }

  getPairCombos(): SubCombo[] {
    const handCount = calculateHandCount(this.hand);
    const pairs = Object.entries(handCount)
      .filter(([, count]) => count === 2)
      .map(([rank]) => {
        return new SubCombo(rank, new Hand(this.hand.cards.filter((c) => c.rank === parseInt(rank))), COMBOS.PAIR);
      });

    return pairs;
  }

  getTripleCombos(): SubCombo[] {
    const handCount = calculateHandCount(this.hand);
    const tripleCombos = Object.entries(handCount)
      .filter(([, count]) => count === 3)
      .map(([rank]) => {
        return new SubCombo(rank, new Hand(this.hand.cards.filter((c) => c.rank === parseInt(rank))), COMBOS.TRIPLE);
      });

    return tripleCombos;
  }

  getFullHandCombos(existingCombos: { [type in COMBOS]?: SubCombo[] }): SubCombo[] {
    const fullHand: SubCombo[] = [];
    const [, [type, { isValid: isValidSequentialCombo }]] =
      Object.entries(FullHandCombo).filter(
        ([, { sequential }]) => sequential
      );

    // check for the sequential full hand combos where order matters
    for (let i = 0; i < this.cards().length - 5; i += 1) {
      const cards = this.cards().slice(i, i + 5);
      const hand = new Hand(cards);
      if (isValidSequentialCombo(hand)) {
        fullHand.push(new SubCombo("", hand, type));
      }
    }

    // check for the non-sequential full hand combos where order doesn't matter
    return fullHand.concat(buildNonSequentialCombos(this.hand, existingCombos));
  }

  getHand() {
    return this.hand.printCards(this.name);
  }
}
