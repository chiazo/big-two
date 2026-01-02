export class Hand {
  cards;

  constructor(cards) {
    this.cards = cards.sort((a, b) => {
      if (a.rank !== 2 && b.rank !== 2) {
        return a.rank - b.rank;
      }
      // ensure 2 is highest ranked
      return a.rank == 2 ? 1 : -1;
    });
  }

  min() {
    return this.count() > 1 ? this.cards[0] : this.lastCard();
  }

  max() {
    return this.count() > 1
      ? this.cards[this.cards.length - 1]
      : this.lastCard();
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

  lastCard() {
    if (this.cards.length === 0) {
      return this.cards[0];
    }
  }

  logMove() {
    console.table(
      this.cards.reduce((prev, { rank, ...x }) => {
        prev[rank] = x;
        return prev;
      }, {}),
      ["suit", "symbol"]
    );
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
