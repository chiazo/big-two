import { Table } from "console-table-printer";
import { groupBy, random, shuffle } from 'underscore';
import { Card } from "./card.ts";
import {
  buildNonSequentialCombos,
  calculateHandCount,
  CardCombo,
  FullHandCombo,
  logMessage,
  MAX_PLAYABLE_CARDS,
  SEPARATOR,
  sortByRank,
  sortCards
} from "./common.ts";
import { CHANCE_OF_SKIPPING, COMBOS } from "./constants.ts";
import { Deck } from "./deck.ts";
import { Hand } from "./hand.js";

export class SubCombo {
  rank: string;
  hand: Hand;
  type: string;
  constructor(rank = '', hand: Hand, type: string) {
    this.rank = rank;
    this.hand = hand;
    this.type = type;
  }

  // returns the best cards of the rank
  best(rank: string, count: number = 1): Card[] {
    return this.hand.cards.filter((c) => c.rank == parseInt(rank)).sort(sortByRank).slice(count * -1)
  }
}

export class Player {
  static RANDOM_NAMES = ["Obi", "Toby", "Adanna", "Nneoma", "Kamsi"];
  name: string;
  hand: Hand;
  combos: { [key in COMBOS]?: SubCombo[] } = {};
  skip: boolean;
  isComputer: boolean;

  constructor(hand: Hand, name: string = this.#randomName(), isComputer: boolean = true) {
    this.hand = hand;
    this.name = name;
    this.isComputer = isComputer;
    this.skip = false;
  }

  cards() {
    return this.hand.cards;
  }

  has(card: Card) {
    return this.hand.cards.some((c) => c.toString() === card.toString())
  }

  #randomName() {
    const name = Player.RANDOM_NAMES[random(Player.RANDOM_NAMES.length - 1)];
    Player.RANDOM_NAMES = Player.RANDOM_NAMES.filter((n) => n !== name);
    return name;
  }

  playCombo(combo: Hand, lastHandPlayed: Hand | undefined, round: number) {
    const cardCount =
      lastHandPlayed !== undefined ? lastHandPlayed.cards.length : Math.max(combo.cards.length, 1);
    const minCardsRequired = Math.min(cardCount, MAX_PLAYABLE_CARDS);
    const [existingCardCombo] = Object.values(CardCombo).filter(
      (cc) => cc.count == combo.cards.length
    );

    if (existingCardCombo === undefined) {
      return {
        validCombo: false,
        comboPlayed: undefined,
        error: "the number of cards selected is invalid",
      };
    }
    if (!existingCardCombo.isValid(combo)) {
      return {
        validCombo: false,
        comboPlayed: undefined,
        error: "the given card combo is invalid",
      };
    }

    if (
      combo.cards.length < minCardsRequired ||
      combo.cards.length > MAX_PLAYABLE_CARDS
    ) {
      return {
        validCombo: false,
        comboPlayed: undefined,
        error: "the card count is too little or too high",
      };
    }

    if (
      round === 0 && !lastHandPlayed && !combo.has(Deck.LOWEST_CARD)
    ) {
      return {
        validCombo: false,
        comboPlayed: undefined,
        error: "3 of diamonds must be in the game's first played hand",
      };
    }

    return {
      validCombo: true,
      comboPlayed: combo,
      error: ""
    };
  }

  removeCards(combo: Hand) {
    const mapping = combo.cards.map((c) => c.toString());
    this.hand.cards = this.cards().filter(
      (c) => !mapping.includes(c.toString())
    );
  }

  autoPlay(lastHandPlayed: Hand | undefined, round: number) {
    if (!this.isComputer) {
      return;
    }
    this.calculateCombos();
    return this.playBestHand(lastHandPlayed, round);
  }

  skipRound() {
    if (this.skip) {
      return;
    }
    this.skip = true;
    console.log(`${this.name} skipped their turn.`)
  }

  resetRound() {
    this.skip = false;
  }

  playBestHand(lastHandPlayed: Hand | undefined, round: number) {
    let bestHandForRound;

    const isRoundLeader = lastHandPlayed == undefined;
    if (isRoundLeader) {
      const mustPlayThreeOfDiamonds = isRoundLeader && round === 0 && this.has(Deck.LOWEST_CARD)
      if (mustPlayThreeOfDiamonds) {
        bestHandForRound = Object.values(this.combos).flat().find((s) => s.hand.has(Deck.LOWEST_CARD))?.hand
      } else { // otherwise decide whether to play the best overall hand or one that just barely beats the last player
        const bestCombo = Object.keys(this.combos).find(k => { const subcombos = this.combos[k as keyof typeof COMBOS]; return subcombos && subcombos.length > 0 })
        const bestComboValues: SubCombo[] = this.combos[bestCombo as keyof typeof COMBOS] || []
        // old logic for always choosing the best hand to play
        // bestHandForRound = bestComboValues.sort((a: SubCombo, b: SubCombo) => sortHands(a.hand, b.hand) === a.hand ? 1 : -1).pop()?.hand
        bestHandForRound = shuffle(bestComboValues).pop()?.hand
      }
    } else { // this means we have to follow the pattern already set by the prev player
      bestHandForRound = this.bestHand(COMBOS[lastHandPlayed.type as keyof typeof COMBOS], lastHandPlayed);
    }

    // skip if you don't have a hand for this round
    if (!bestHandForRound) {
      this.skipRound();
      return;
    }

    // skip if you can't beat the last hand played
    if (!isRoundLeader && (lastHandPlayed && !bestHandForRound.beats(lastHandPlayed))) {
      this.skipRound();
      return;
    }

    const result = this.playCombo(bestHandForRound, lastHandPlayed, round);
    if (!result.validCombo || !result.comboPlayed) {
      logMessage(`Uh oh! ${this.name} played an invalid combo`);
    }
    return result;
  }

  bestHand(type: COMBOS, lastHandPlayed: Hand) {
    const availableMoves = this.combos[type];
    if (!availableMoves || availableMoves.length == 0) {
      return;
    }
    if (type === COMBOS.FULL_HAND) {
      const moves = availableMoves.map((c) => c.hand).filter((h) => h.beats(lastHandPlayed))
      return moves[random(moves.length - 1)]
      // old logic to always return the best hand
      // return availableMoves.map((c) => c.hand).reduce(getMaxHand);
    }

    // old logic to always choose best card
    // const maxRank =
    //   availableMoves.map((c) => c.hand.cards.reduce(getMaxRank)).sort(sortCards).map((c) => c.rank).pop()

    const bestCards = shuffle([...new Set(availableMoves.filter((m) => m.hand.beats(lastHandPlayed)).map((m) => parseInt(m.rank)))])
    const randomIdx = random(bestCards.length - 1)
    const randomCard = bestCards[randomIdx]
    const randomlyDecideToSkip = random(100) <= CHANCE_OF_SKIPPING



    const cards = this.hand.cards
      .filter((c) => c.rank === randomCard)
      .slice(0, CardCombo[type].count);

    if (cards.length === 0) {
      return;
    }

    // simulate players skipping even when they can indeed play 
    if (randomlyDecideToSkip) {
      console.log(`${this.name} wants to save some of their cards for later...`)
      return;
    }

    return new Hand(cards);
  }

  eligibleMoves(lastComboPlayed: Hand): string[] {
    const keys = Object.keys(this.combos).filter((k) => lastComboPlayed.type == k).map((k) => this.combos[k as keyof typeof COMBOS]).flat()
    if (!keys) {
      return [];
    }
    return keys.reduce((prev: Card[], curr) => {
      return prev.concat(curr ? curr.hand.cards : [])
    }, []).sort(sortCards).map((c) => c.toString())
  }

  logCombos(lastComboPlayed: Hand | undefined) {
    this.calculateCombos()
    console.log(`\n ---- The combos you have available are: ---- `);
    let keys: COMBOS[] = Object.keys(this.combos).map(k => COMBOS[k as keyof typeof COMBOS])
    if (lastComboPlayed) {
      keys = keys.filter((k) => lastComboPlayed.type == k)
    }
    const subcombos = keys.filter((k) => this.combos[k] && this.combos[k].length > 0).map((k) => this.combos[k]).reduce((prev, curr) => prev?.concat(curr || []), [])?.flat() || []
    const groups = groupBy(subcombos.map((s) => { return { combo: s.type, hands: s.hand.cards.length === 5 ? s.hand.toString() : [...new Set(s.hand.rank())].pop() } }), (c) => c.combo)
    const rows = Object.entries(groups).map(([type, vals]) => { return { combo: type.replace("_", " "), hands: vals.map(v => v.hands) } })
    const table = new Table({ columns: [{ name: "combo", color: "yellow" }, { name: "hands", color: "green" }], defaultColumnOptions: { alignment: "center" }, rows: rows });

    if (rows.length > 0) {
      table.printTable()
    } else {
      console.log("Dang, you don't have any eligible moves for this round!")
    }
    console.log(SEPARATOR);
  }

  calculateCombos() {
    const combos: { [key in COMBOS]?: SubCombo[] } = {
      [COMBOS.SINGLE]: this.getSingleCombos(),
      [COMBOS.PAIR]: this.getPairCombos(),
      [COMBOS.TRIPLE]: this.getTripleCombos(),
    };

    combos[COMBOS.FULL_HAND] = this.getFullHandCombos(combos)
    this.combos = combos;
  }

  getSingleCombos(): SubCombo[] {
    const handCount = calculateHandCount(this.hand);
    const singles: SubCombo[] = Object.entries(handCount)
      .filter(([, count]) => count >= 1)
      .map(([rank]) => {
        return new SubCombo(rank, new Hand(this.hand.cards.filter((c) => c.rank === parseInt(rank)).slice(0, 1)), COMBOS.SINGLE);
      });

    return singles;
  }

  getPairCombos(): SubCombo[] {
    const handCount = calculateHandCount(this.hand);
    const pairs = Object.entries(handCount)
      .filter(([, count]) => count >= 2)
      .map(([rank]) => {
        return new SubCombo(rank, new Hand(this.hand.cards.filter((c) => c.rank === parseInt(rank)).slice(0, 2)), COMBOS.PAIR);
      });

    return pairs;
  }

  getTripleCombos(): SubCombo[] {
    const handCount = calculateHandCount(this.hand);
    const tripleCombos = Object.entries(handCount)
      .filter(([, count]) => count >= 3)
      .map(([rank]) => {
        return new SubCombo(rank, new Hand(this.hand.cards.filter((c) => c.rank === parseInt(rank)).slice(0, 3)), COMBOS.TRIPLE);
      });

    return tripleCombos;
  }

  getFullHandCombos(existingCombos: { [type in COMBOS]?: SubCombo[] }): SubCombo[] {
    const fullHand: SubCombo[] = [];
    const [, [type, { isValid: isValidSequentialCombo }]] =
      Object.entries(FullHandCombo).filter(
        ([, { sequential }]) => sequential
      );

    // check for the sequential full hand combos where order matters
    for (let i = 0; i < this.cards().length - 5; i += 1) {
      const cards = this.cards().slice(i, i + 5);
      const hand = new Hand(cards);
      if (isValidSequentialCombo(hand)) {
        fullHand.push(new SubCombo("", hand, type));
      }
    }

    // check for the non-sequential full hand combos where order doesn't matter
    return fullHand.concat(buildNonSequentialCombos(this.hand, existingCombos));
  }

  getHand() {
    return this.hand.printCards(this.name);
  }
}
