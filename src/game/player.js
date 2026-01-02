import {
  calculateHandCount,
  CARD_COMBOS,
  COMBOS,
  findFullHandNonSequentialCombos,
  FULL_HAND_COMBO,
  logMessage,
  MAX_PLAYABLE_CARDS,
  SEPARATOR,
} from "./contants.js";
import { Hand } from "./hand.js";

export class Player {
  static RANDOM_NAMES = ["Obi", "Toby", "Adanna", "Nneoma", "Kamsi"];
  name;
  hand;
  combos;
  isComputer;
  lastComboPlayed;

  constructor(hand, name = this.randomName(), isComputer = true) {
    this.hand = hand;
    this.name = name;
    this.isComputer = isComputer;
    this.combos = {};
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

  playCombo(combo) {
    const cardCount =
      this.lastComboPlayed != null ? this.lastComboPlayed.cards.length : 1;
    const minCardsRequired = Math.min(cardCount, MAX_PLAYABLE_CARDS);

    const [existingCardCombo] = Object.values(CARD_COMBOS).filter(
      (cc) => cc.count == combo.cards.length
    );

    if (existingCardCombo == null) {
      return {
        validCombo: false,
        comboPlayed: null,
        error: "the number of cards selected is invalid",
      };
    }
    if (!existingCardCombo.valid(combo)) {
      return {
        validCombo: false,
        comboPlayed: null,
        error: "the given card combo is invalid",
      };
    }

    if (
      combo.cards.length < minCardsRequired ||
      combo.cards.length > MAX_PLAYABLE_CARDS
    ) {
      return {
        validCombo: false,
        comboPlayed: null,
        error: "the card count is too little or too high",
      };
    }

    this.lastComboPlayed = combo;
    this.hand.cards = this.cards().filter((c) => !combo.cards.includes(c));
    return {
      validCombo: true,
      comboPlayed: combo,
    };
  }

  autoPlay(lastComboPlayed) {
    if (!this.isComputer) {
      return;
    }
    this.calculateCombos();
    return this.playBestHand(lastComboPlayed);
  }

  playBestHand(lastComboPlayed) {
    const minCardsNeeded =
      lastComboPlayed == null ? 1 : lastComboPlayed.cards.length;
    const move = this.cards().splice(0, minCardsNeeded);
    const hand = new Hand(move);
    const result = this.playCombo(hand);
    if (result.validCombo && result.comboPlayed) {
      hand.logMove();
    } else {
      logMessage(`Uh oh! ${this.name} played an invalid combo`);
    }
    return result;
  }

  logCombos() {
    console.log(`${this.name} - wowza!`);
    for (const type of Object.keys(this.combos)) {
      const values = this.combos[type];
      console.log(
        `type — ${type}:`,
        values.map(
          (v) => v.rank || v.hand.toString() + ` — ${v.type}` || v.type
        )
      );
    }
    console.log(SEPARATOR);
  }

  calculateCombos() {
    const combos = {};
    this.getSingleCombos(combos);
    this.getPairCombos(combos);
    this.getTripleCombos(combos);
    this.getFullHandCombos(combos);
    this.combos = combos;
    this.logCombos();
  }

  getSingleCombos(combos) {
    const handCount = calculateHandCount(this.hand);
    const singles = Object.entries(handCount)
      .filter(([, count]) => count === 1)
      .map(([rank]) => {
        return { rank: rank };
      });

    return (combos[COMBOS.SINGLE] = singles);
  }

  getPairCombos(combos) {
    const handCount = calculateHandCount(this.hand);
    const pairs = Object.entries(handCount)
      .filter(([, count]) => count === 2)
      .map(([rank]) => {
        return { rank: rank };
      });

    return (combos[COMBOS.PAIR] = pairs);
  }

  getTripleCombos(combos) {
    const handCount = calculateHandCount(this.hand);
    const tripleCombos = Object.entries(handCount)
      .filter(([, count]) => count === 3)
      .map(([rank]) => {
        return { rank: rank };
      });

    return (combos[COMBOS.TRIPLE] = tripleCombos);
  }

  getFullHandCombos(combos) {
    const fullHand = [];
    const [, [sequentialCombo, { valid: isValidSequentialCombo }]] =
      Object.entries(FULL_HAND_COMBO).filter(
        ([, { sequential }]) => sequential
      );

    // check for the sequential full hand combos where order matters
    for (let i = 0; i < this.cards().length - 5; i += 1) {
      const cards = this.cards().slice(i, i + 5);
      const hand = new Hand(cards);
      if (isValidSequentialCombo(hand)) {
        fullHand.push({ hand: hand, type: sequentialCombo });
      }
    }

    // check for the non-sequential full hand combos where order doesn't matter
    findFullHandNonSequentialCombos(this.hand, fullHand);

    combos[COMBOS.FULL_HAND] = fullHand;
  }

  getHand() {
    return this.hand.printCards(this.name);
  }
}
