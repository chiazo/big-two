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
    console.table(this.cards, ["suit", "symbol", "rank"]);
  }

  printCards(player) {
    console.log("=============================================");
    console.log(`Player ${player.name} has the following cards:`);
    console.log(
      this.cards.map((c) => `${c.symbol} ${c.name || c.rank}`).join(" || ")
    );
    console.log("=============================================");
  }
}
