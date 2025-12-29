export class Player {
  static RANDOM_NAMES = ["Obi", "Toby", "Adanna", "Nneoma", "Kamsi"];
  name;
  hand;

  constructor(hand, name = this.randomName()) {
    this.hand = hand;
    this.name = name;
  }

  randomName() {
    const index = Math.floor(Math.random() * Player.RANDOM_NAMES.length);
    const name = Player.RANDOM_NAMES[index];
    Player.RANDOM_NAMES = Player.RANDOM_NAMES.filter((n) => n !== name);
    return name;
  }

  getHand() {
    return this.hand.printCards(this);
  }
}
