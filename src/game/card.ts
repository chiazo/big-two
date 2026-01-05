import { CardSuit, RANKS } from "./constants.ts";

export class Card {
  suit: string;
  symbol: string;
  rank: number;
  name: string;
  faceCard: boolean;

  constructor(suit: string, symbol: string, rank: number) {
    const [validSuit, validRank, validSymbol] = this.validateCard(
      suit,
      rank,
      symbol
    );

    if (validSuit && validRank && validSymbol) {
      const faceCard = this.#isFaceCard(rank);
      this.suit = suit;
      this.rank = rank;
      this.symbol = symbol;
      this.faceCard = faceCard;
      this.name = this.#getCardName(rank, faceCard);
    } else {
      throw new RangeError(`${rank} of ${symbol} is invalid`);
    }
  }

  validateCard(suit: string, rank: number, symbol: string) {
    return [
      this.validateSuit(suit),
      this.validateRank(rank),
      this.validateSymbol(symbol),
    ];
  }

  validateSuit(suit: string) {
    return Object.keys(CardSuit).indexOf(suit) >= 0;
  }

  validateRank(rank: number) {
    if (this.#isFaceCard(rank)) {
      return true;
    }

    return (
      rank >= RANKS.NUMERAL_CARDS.MIN.value &&
      rank <= RANKS.NUMERAL_CARDS.MAX.value
    );
  }

  validateSymbol(symbol: string) {
    return Object.values(CardSuit)
      .map((c: CardSuit) => c.symbol)
      .includes(symbol);
  }

  toString() {
    return `${this.symbol} ${this.name || this.rank}`;
  }

  #getCardName(rank: number, isFaceCard: boolean) {
    const faceCardName = Object.keys(RANKS.FACE_CARDS).find(
      (c: string) =>
        RANKS.FACE_CARDS[c as keyof typeof RANKS.FACE_CARDS] === rank
    );
    if (isFaceCard) {
      return faceCardName || "";
    }

    return rank === RANKS.NUMERAL_CARDS.MIN.value
      ? RANKS.NUMERAL_CARDS.MIN.name
      : "";
  }

  #isFaceCard(rank: number) {
    return Object.values(RANKS.FACE_CARDS).indexOf(rank) >= 0;
  }
}
