import { CARD_COMBOS, MAX_PLAYABLE_CARDS } from "./contants.js";
import { Hand } from "./hand.js";

export class Player {
  static RANDOM_NAMES = ["Obi", "Toby", "Adanna", "Nneoma", "Kamsi"];
  name;
  hand;
  isComputer;
  lastComboPlayed;

  constructor(hand, name = this.randomName(), isComputer = false) {
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
        lastComboPlayed: null,
        error: "the number of cards selected is invalid",
      };
    }
    if (!existingCardCombo.valid(combo)) {
      return {
        validCombo: false,
        lastComboPlayed: null,
        error: "the given card combo is invalid",
      };
    }

    if (
      combo.cards.length < minCardsRequired ||
      combo.cards.length > MAX_PLAYABLE_CARDS
    ) {
      return {
        validCombo: false,
        lastComboPlayed: null,
        error: "the card count is too little or too high",
      };
    }

    this.lastComboPlayed = combo;
    this.hand.cards = this.hand.cards.filter((c) => combo.cards.includes(c));
    return {
      validCombo: true,
      lastComboPlayed: combo,
    };
  }

  autoPlay(lastComboPlayed) {
    if (!this.isComputer) {
      return;
    }
    this.playBestHand(lastComboPlayed);
  }

  autoPlayBestHand(lastComboPlayed) {
    console.log(`Dummy play best hand; Last combo played: `, lastComboPlayed);
    this.playCombo(new Hand(this.hand.cards.slice(0, 3)));
  }

  getHand() {
    return this.hand.printCards(this);
  }
}
