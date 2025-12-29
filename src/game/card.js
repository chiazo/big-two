import { SUITS, RANKS } from "./contants.js";

export class Card {
  suit;
  rank;
  name;
  faceCard;

  constructor(suit, rank) {
    const [validSuit, validRank] = this.validateCard(suit, rank);

    if (validSuit && validRank) {
      const faceCard = this.isFaceCard(rank);
      this.suit = suit;
      this.rank = rank;
      this.faceCard = faceCard;
      this.name = this.getCardName(rank, faceCard);
    }
  }

  validateCard(suit, rank) {
    return [this.validateSuit(suit), this.validateRank(rank)];
  }

  validateSuit(suit) {
    return Object.keys(SUITS).indexOf(suit) >= 0;
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

  getCardName(rank, isFaceCard) {
    if (isFaceCard) {
      return Object.keys(RANKS.FACE_CARDS).find(
        (c) => RANKS.FACE_CARDS[c] === rank
      );
    }

    return rank === RANKS.NUMERAL_CARDS.MIN.value
      ? RANKS.NUMERAL_CARDS.MIN.name
      : "";
  }

  isFaceCard(rank) {
    return Object.values(RANKS.FACE_CARDS).indexOf(rank) >= 0;
  }
}
