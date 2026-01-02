import { Card } from "./card.js";
import { SUITS, DECK_SIZE, RANK_COUNT, RANKS } from "./contants.js";

export class Deck {
  size;
  rankCount;
  cards;

  constructor(size = DECK_SIZE, rankCount = RANK_COUNT) {
    const cards = this.createCards();

    if (cards.length != DECK_SIZE) {
      return;
    }

    this.size = size;
    this.rankCount = rankCount;
    this.cards = cards;
  }

  createCards() {
    const cards = [];
    for (const [suit, { symbol }] of Object.entries(SUITS)) {
      for (
        let i = RANKS.NUMERAL_CARDS.MIN.value;
        i <= RANKS.NUMERAL_CARDS.MAX.value;
        i++
      ) {
        cards.push(new Card(suit, symbol, i));
      }

      for (const faceCardRank of Object.values(RANKS.FACE_CARDS)) {
        cards.push(new Card(suit, symbol, faceCardRank));
      }
    }
    return cards;
  }
}
