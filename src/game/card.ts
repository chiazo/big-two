import { CardSuit, RANKS } from "./common.ts";

export class Card {
  suit: string;
  symbol: string;
  rank: number;
  name: string;
  faceCard: boolean;

  constructor(suit: string, symbol: string, rank: number) {
    const [validSuit, validRank] = this.validateCard(suit, rank);

    if (validSuit && validRank) {
      const faceCard = this.isFaceCard(rank);
      this.suit = suit;
      this.rank = rank;
      this.symbol = symbol;
      this.faceCard = faceCard;
      this.name = this.getCardName(rank, faceCard);
    } else {
      throw new Error(`${rank} of ${symbol} is invalid`)
    }
  }

  validateCard(suit, rank) {
    return [this.validateSuit(suit), this.validateRank(rank)];
  }

  validateSuit(suit) {
    return Object.keys(CardSuit).indexOf(suit) >= 0;
  }

  validateRank(rank) {
    if (this.isFaceCard(rank)) {
      return true;
    }

    return (
      rank >= RANKS.NUMERAL_CARDS.MIN.value &&
      rank <= RANKS.NUMERAL_CARDS.MAX.value
    );
  }

  toString() {
    return `${this.symbol} ${this.name || this.rank}`;
  }

  getCardName(rank, isFaceCard) {
    const faceCardName = Object.keys(RANKS.FACE_CARDS).find(
      (c) => RANKS.FACE_CARDS[c] === rank
    );
    if (isFaceCard) {
      return faceCardName || "";
    }

    return rank === RANKS.NUMERAL_CARDS.MIN.value
      ? RANKS.NUMERAL_CARDS.MIN.name
      : "";
  }

  isFaceCard(rank) {
    return Object.values(RANKS.FACE_CARDS).indexOf(rank) >= 0;
  }
}
