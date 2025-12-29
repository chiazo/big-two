export class Hand {
  cards;

  constructor(cards) {
    this.cards = cards;
  }

  printCards(player) {
    console.log("=============================================");
    console.log(`Player ${player.name} has the following cards:`);
    this.cards.forEach((c) => {
      console.log(`${c.name || c.rank} of ${c.suit}`);
    });
  }
}
