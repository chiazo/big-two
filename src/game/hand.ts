import {
  calculateHandCount,
  findHandCount,
  CardCombo,
  FullHandCombo,
  getMaxHand,
  sortCards,
  sortByRank,
} from "./common.ts";
import { Card } from "./card.js"

export class Hand {
  cards: Card[];
  type: string;

  constructor(cards: Card[], type = this.defaultType(cards.length)) {
    this.sort(cards);
    this.type = type || "";
  }

  defaultType(cardCount) {
    for (const type in CardCombo) {
      if (CardCombo[type].count === cardCount) {
        return type;
      }
    }
  }

  sort(cards = this.cards) {
    this.cards = cards.sort(sortCards);
    return this;
  }

  max(): Card {
    this.sort();
    if (this.type === FullHandCombo.FULL_HOUSE.toString()) {
      const counts = findHandCount(calculateHandCount(this), 3);
      const triple = findHandCount(counts, 3);
      const max = this.cards.reverse().find((c) => c.rank === parseInt(triple));
      if (max == undefined) {
        throw this.throwErr("max full house")
      }
      return max
    }
    if (this.count() > 0) {
      return this.cards[this.cards.length - 1]
    }
    throw this.throwErr("max")
  }

  count() {
    return this.cards.length;
  }

  suit() {
    return this.cards.map((c) => c.suit);
  }

  rank() {
    return this.cards.map((c) => c.rank);
  }

  throwErr(operation) {
    throw new Error(`${operation} is invalid for this hand.`)
  }

  join(hand: Hand | undefined) {
    if (hand) {
      this.cards = this.cards.concat(hand.cards);
      this.sort();
    }
    return this;
  }

  beats(hand) {
    const maxVal = getMaxHand(hand, this);
    return this === maxVal;
  }

  logMove() {
    console.table(this.cards, ["rank", "suit", "symbol"])
    // console.table(
    //   this.cards.reduce((prev, { rank, ...x }) => {
    //     prev[rank] = x;
    //     return prev;
    //   }, {}),
    //   ["suit", "symbol"]
    // );
  }

  toString() {
    return this.cards
      .map((c) => `${c.symbol} ${c.name || c.rank}`)
      .join(" || ");
  }

  printCards(playerName) {
    console.log("=============================================");
    console.log(`Player ${playerName} has the following cards:`);
    console.log(this.toString());
    console.log("=============================================");
  }
}
