import { CARD_COMBOS, logMessage, MAX_PLAYABLE_CARDS } from "./contants.js";
import { Hand } from "./hand.js";

export class Player {
  static RANDOM_NAMES = ["Obi", "Toby", "Adanna", "Nneoma", "Kamsi"];
  name;
  hand;
  isComputer;
  lastComboPlayed;

  constructor(hand, name = this.randomName(), isComputer = true) {
    this.hand = hand;
    this.name = name;
    this.isComputer = isComputer;
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
    this.hand.cards = this.hand.cards.filter((c) => !combo.cards.includes(c));
    return {
      validCombo: true,
      comboPlayed: combo,
    };
  }

  autoPlay(lastComboPlayed) {
    if (!this.isComputer) {
      return;
    }
    return this.playBestHand(lastComboPlayed);
  }

  playBestHand(lastComboPlayed) {
    const minCardsNeeded = lastComboPlayed == null ? 1 : lastComboPlayed.length;
    const move = this.hand.cards.splice(0, minCardsNeeded);
    const hand = new Hand(move);
    const result = this.playCombo(hand);
    if (result.validCombo && result.comboPlayed) {
      hand.logMove();
    } else {
      logMessage(`Uh oh! ${this.name} played an invalid combo`);
    }
    return result;
  }

  getHand() {
    return this.hand.printCards(this);
  }
}
