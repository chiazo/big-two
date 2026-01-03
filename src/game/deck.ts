import { Card } from "./card.js";
import { CardSuit, DECK_SIZE, RANK_COUNT, RANKS } from "./common.ts";

export class Deck {
  size: number;
  rankCount: number;
  cards: Card[];

  constructor(size = DECK_SIZE, rankCount = RANK_COUNT) {
    const cards = this.createCards();

    if (cards.length != DECK_SIZE) {
      throw new Error(`Cards in deck exceed ${DECK_SIZE}`)
    }

    this.size = size;
    this.rankCount = rankCount;
    this.cards = cards;
  }

  createCards() {
    const cards: Card[] = [];
    for (const [suit, { symbol }] of Object.entries(CardSuit)) {
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
