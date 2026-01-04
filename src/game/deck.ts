import { Card } from "./card.js";
import { shuffle } from "underscore"
import { CardSuit, DECK_SIZE, RANK_COUNT, RANKS, sortCards } from "./common.ts";

export class Deck {
  size: number;
  rankCount: number;
  cards: Card[];

  constructor(cards = this.createCards(), shuffle = true, size = DECK_SIZE, rankCount = RANK_COUNT) {
    if (cards.length > DECK_SIZE) {
      throw new Error(`Cards in deck exceed ${DECK_SIZE}`)
    }

    this.size = size;
    this.rankCount = rankCount;
    this.cards = cards;
    if (shuffle) {
      this.shuffle();
    }
  }

  shuffle() {
    if (this.cards.length === DECK_SIZE) {
      this.cards = shuffle(this.cards)
    }
  }

  sort() {
    this.cards.sort(sortCards)
  }

  removeCards(cards: Card[]) {
    const mapping = cards.map((c) => c.toString());
    this.cards = this.cards.filter(
      (c) => !mapping.includes(c.toString())
    );
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
