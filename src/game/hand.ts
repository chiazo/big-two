import { Table } from "console-table-printer";
import { Card } from "./card.js";
import {
  calculateHandCount,
  CardCombo,
  findHandCount,
  FullHandCombo,
  getMaxHand,
  MAX_PLAYABLE_CARDS,
  sortCards,
} from "./common.ts";

export class Hand {
  cards: Card[] = [];
  type: string;

  constructor(cards: Card[], type = this.defaultType(cards.length)) {
    this.sort(cards);
    this.type = type || "";
  }

  defaultType(cardCount: number) {
    for (const [type, val] of Object.entries(CardCombo)) {
      if (val.count === cardCount) {
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
      const counts = calculateHandCount(this);
      const triple = findHandCount(counts, 3);
      const max = this.cards.reverse().find((c) => c.rank === parseInt(triple));
      if (max == undefined) {
        throw this.throwErr("max full house");
      }
      return max;
    }
    if (this.count() > 0) {
      return this.cards[this.cards.length - 1];
    }
    throw this.throwErr("max");
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

  throwErr(operation: string) {
    throw new Error(`${operation} is invalid for this hand.`);
  }

  join(hand: Hand | undefined) {
    if (hand) {
      if (this.cards.length + hand.cards.length > MAX_PLAYABLE_CARDS) {
        throw new RangeError("cannot merge hands and exceed 5 cards");
      }

      if (this.cards.some((c) => hand.has(c))) {
        throw new Error("cannot merge hands that have overlapping cards");
      }

      this.cards = this.cards.concat(hand.cards);
      let type;
      if (this.cards.length === 5) {
        type = Object.values(FullHandCombo)
          .filter((c: FullHandCombo) => c.isValid(this))
          .map((c: FullHandCombo) => c.key)
          .pop();
      } else {
        type = Object.values(CardCombo)
          .filter((c: CardCombo) => c.isValid(this))
          .map((c: CardCombo) => c.toString())
          .pop();
      }
      if (type) this.type = type;
      this.sort();
    }
    return this;
  }

  beats(hand: Hand) {
    const maxVal: Hand = getMaxHand(hand, this);
    return this.toString() === maxVal.toString();
  }

  has(card: Card) {
    return this.cards.map((c) => c.toString()).includes(card.toString());
  }

  logMove() {
    const table = new Table({
      columns: [
        { name: "rank", color: "blue" },
        { name: "suit", color: "green" },
        { name: "symbol", color: "yellow" },
      ],
      defaultColumnOptions: { alignment: "center" },
      rows: this.cards.map((c) => {
        return { rank: c.rank, suit: c.suit, symbol: c.symbol };
      }),
    });
    table.printTable();
  }

  toString() {
    return this.cards
      .map((c) => `${c.symbol} ${c.name || c.rank}`)
      .join(" || ");
  }

  printCards(playerName: string) {
    console.log("=============================================");
    console.log(`Player ${playerName} has the following cards:`);
    console.log(this.toString());
    console.log("=============================================");
  }
}
