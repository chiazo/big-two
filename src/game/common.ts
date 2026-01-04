import { Card } from "./card.js";
import { Hand } from "./hand.js";
import { Deck } from "./deck.js";
import { SubCombo } from "./player.js";
import { shuffle, isEmpty } from 'underscore';

// CONSTANTS
export const DECK_SIZE = 52;
export const MAX_PLAYERS = 4;
export const MAX_PLAYABLE_CARDS = 5;
export const RANK_COUNT = 13;
export const SKIP_ROUND = "SKIP ROUND";
export const SEPARATOR =
  "\n=============================================================================\n";

// ENUMS
export enum COMBOS {
  SINGLE = "SINGLE",
  PAIR = "PAIR",
  TRIPLE = "TRIPLE",
  FULL_HAND = "FULL_HAND",
}

export enum FULL_HAND_TYPES {
  STRAIGHT = "STRAIGHT",
  FLUSH = "FLUSH",
  FULL_HOUSE = "FULL_HOUSE",
  FOUR_OF_A_KIND = "FOUR_OF_A_KIND",
  STRAIGHT_FLUSH = "STRAIGHT_FLUSH",
}

// COMPLEX ENUM CLASSES
export class CardSuit {
  static readonly DIAMONDS = new CardSuit("DIAMONDS", "♦", 1);
  static readonly CLUBS = new CardSuit("CLUBS", "♣", 2);
  static readonly HEARTS = new CardSuit("HEARTS", "♥", 3);
  static readonly SPADES = new CardSuit("SPADES", "♠", 4);

  private constructor(
    private readonly key: string,
    public readonly symbol: string,
    public readonly ranking: number
  ) { }

  toString(): string {
    return this.key;
  }
}

export class CardCombo {
  static readonly SINGLE = new CardCombo(COMBOS.SINGLE, 1, (h) => {
    h.type = COMBOS.SINGLE;
    return h.cards.length === 1;
  });
  static readonly PAIR = new CardCombo(COMBOS.PAIR, 2, (h) => {
    h.type = COMBOS.PAIR;
    return h.cards.length === 2 && [...new Set(h.rank())].length == 1;
  });
  static readonly TRIPLE = new CardCombo(COMBOS.TRIPLE, 3, (h) => {
    h.type = COMBOS.TRIPLE;
    return h.cards.length === 3 && [...new Set(h.rank())].length == 1;
  });
  static readonly FULL_HAND = new CardCombo(COMBOS.FULL_HAND, 5, (h) => {
    const [key] = Object.keys(FullHandCombo).filter((k) => {
      return FullHandCombo[k as keyof typeof FULL_HAND_TYPES].isValid(h);
    });

    h.type = key
    return h.cards.length === 5 && key !== null;
  });

  private constructor(
    private readonly key: COMBOS,
    public readonly count: number,
    public readonly isValid: (h: Hand) => boolean
  ) { }

  toString(): string {
    return this.key;
  }
}

export class FullHandCombo {
  static readonly STRAIGHT = new FullHandCombo(
    FULL_HAND_TYPES.STRAIGHT,
    true,
    (h) => isStraight(h),
    1
  );
  static readonly FLUSH = new FullHandCombo(
    FULL_HAND_TYPES.FLUSH,
    false,
    (h) => isFlush(h),
    2
  );
  static readonly FULL_HOUSE = new FullHandCombo(
    FULL_HAND_TYPES.FULL_HOUSE,
    false,
    (h) => isFullHouse(h),
    3
  );
  static readonly FOUR_OF_A_KIND = new FullHandCombo(
    FULL_HAND_TYPES.FOUR_OF_A_KIND,
    false,
    (h) => isFourOfAKind(h),
    4
  );
  static readonly STRAIGHT_FLUSH = new FullHandCombo(
    FULL_HAND_TYPES.STRAIGHT_FLUSH,
    true,
    (h) => isFlush(h) && isStraight(h),
    5
  );

  private constructor(
    public readonly key: FULL_HAND_TYPES,
    public readonly sequential: boolean,
    public readonly isValid: (h: Hand) => boolean,
    public readonly ranking: number
  ) { }

  toString(): string {
    return this.key;
  }
}

export const RANKS = {
  NUMERAL_CARDS: {
    MIN: {
      value: 1,
      name: "ACE",
    },
    MAX: {
      value: 10,
      name: "",
    },
  },
  FACE_CARDS: {
    JACK: 11,
    QUEEN: 12,
    KING: 13,
  },
};


// HELPER METHODS
const isSequential = (a: number, b: number) => b - a === 1;

export const getMaxSuit = (a: Card, b: Card): Card => {
  const aRanking = CardSuit[a.suit as keyof typeof CardSuit].ranking;
  const bRanking = CardSuit[b.suit as keyof typeof CardSuit].ranking;
  const maxRanking = Math.max(aRanking, bRanking);
  return maxRanking === aRanking ? a : b;
};

export const sortBySuit = (a: Card, b: Card) => {
  const maxCard = getMaxSuit(a, b);
  return a.suit === maxCard.suit ? 1 : -1;
};

export const getMaxRank = (a: Card, b: Card): Card => {
  if (a.rank > 2 && b.rank > 2) {
    return Math.max(a.rank, b.rank) === a.rank ? a : b;
  }
  // ensure 2 and Ace are ranked highest
  if (a.rank === 2) {
    return a;
  }
  if (b.rank === 2) {
    return b;
  }
  return a.rank > 2 ? b : a;
};

export const sortByRank = (a: Card, b: Card) => {
  const maxCard = getMaxRank(a, b);
  return a.rank == maxCard.rank ? 1 : -1;
};

export const getMaxCard = (a: Card, b: Card): Card => {
  if (a.rank === b.rank) {
    return getMaxSuit(a, b);
  }
  return getMaxRank(a, b);
};

export const sortCards = (a: Card, b: Card) => {
  if (a.rank === b.rank) {
    return sortBySuit(a, b);
  }
  return sortByRank(a, b);
};

export const sortHands = (a: Hand, b: Hand): Hand => {
  const maxCard = a.cards.concat(b.cards).sort(sortCards).pop()
  if (maxCard === undefined) {
    throw new Error("max card is missing when it shouldn't be")
  }
  return a.has(maxCard) ? a : b;
}

export const getMaxHand = (a: Hand, b: Hand): Hand => {
  if (a.cards.length !== b.cards.length) {
    throw new Error("comparison between mismatched hands")
  }
  if (a.cards.length === 5) {
    return getMaxFullHand(a, b);
  }
  const aMax = a.max();
  const bMax = b.max();
  const maxCard = getMaxCard(aMax, bMax);
  return maxCard.toString() === a.max().toString() ? a : b;
};

const getMaxFullHand = (a: Hand, b: Hand): Hand => {
  const aType = a.type;
  const aCombo = FullHandCombo[aType as keyof typeof FULL_HAND_TYPES];
  const bType = b.type;
  const bCombo = FullHandCombo[bType as keyof typeof FULL_HAND_TYPES];

  if (aCombo.ranking === bCombo.ranking) {
    return getMaxCard(a.max(), b.max()).toString() === a.max().toString() ? a : b;
  }
  return aCombo.ranking > bCombo.ranking ? a : b;
};

const sequentialCards = (input: Card[]) => {
  const cards = input.map((c) => c.rank)
  const results: { prevCard: number, comparison: boolean[], numbers: number[] } = { prevCard: cards[0] - 1, comparison: [], numbers: [] }
  return cards.reduce(
    (results, card) => {
      results.comparison.push(isSequential(results.prevCard, card));
      results.numbers.push(card);
      return {
        ...results,
        prevCard: card,
      };
    },
    results
  );
}

const isStraightSeq = (input: Card[]) => {
  const sequence = sequentialCards(input)
  const result = [...new Set(sequence.comparison)];
  return result.length === 1 && !!result[0];
}

// Five cards of any suit in orders
const isStraight = (hand: Hand): boolean => {
  return isStraightSeq(hand.cards)
};

// Five cards of the same suit, irrespective of rank
const isFlush = (hand: Hand): boolean => {
  return [...new Set(hand.suit())].length === 1;
};

// A triple and a pair
const isFullHouse = (hand: Hand): boolean => {
  const counts = calculateHandCount(hand);
  const triple = findHandCount(counts, CardCombo[COMBOS.TRIPLE].count);
  const double = findHandCount(counts, CardCombo[COMBOS.PAIR].count);
  return triple.length > 0 && double.length > 0;
};

// Four cards of the same rank and one random card
const isFourOfAKind = (hand: Hand): boolean => {
  const atMostTwoSuits = [...new Set(hand.suit())].length < 3;
  if (!atMostTwoSuits) {
    return false;
  }

  return findHandCount(calculateHandCount(hand), 4).length > 0;
};

// counts the unique number of cards for a specific rank or suit in a hand
export const calculateHandCount = (hand: Hand, isRankCount: boolean = true) => {
  const counts: { [key: string]: any } = {};
  const handIterable = isRankCount ? hand.rank() : hand.suit();
  for (const symbol of handIterable) {
    if (symbol in counts) {
      counts[symbol]++;
    } else {
      counts[symbol] = 1;
    }
  }
  return counts;
};

// returns the count of cards left in the deck
const calculateDeckCount = (deck: Deck) => {
  const rankCount: { [key: string]: { count: number, cards: Card[] } } = {}
  const suitCount: { [key: string]: { count: number, cards: Card[] } } = {}
  for (const card of deck.cards) {
    if (card.suit in suitCount) {
      suitCount[card.suit].count++;
      suitCount[card.suit].cards.push(card);
    } else {
      suitCount[card.suit] = { count: 1, cards: [card] }
    }

    if (card.rank in rankCount) {
      rankCount[card.rank].count++;
      rankCount[card.rank].cards.push(card)
    } else {
      rankCount[card.rank] = { count: 1, cards: [card] }
    }
  }
  return {
    rankCount: rankCount,
    suitCount: suitCount
  }
}

// filters on whether the explict count desired is represented in a given hand
export const findHandCount = (counts: { [key: string]: any }, desiredCount: number): string => {
  for (const [rank, count] of Object.entries(counts)) {
    if (count === desiredCount) return rank;
  }

  return "";
};

// returns unique count of each rank and suit
export const fullHandCount = (hand: Hand) => {
  return {
    rankCount: calculateHandCount(hand),
    suitCount: calculateHandCount(hand, false),
  };
};

const findStraight = (deck: Deck, isFlush: boolean = false): Card[] => {
  let straightCards: Card[] = []
  for (const suit in CardSuit) {
    const filtered = isFlush ? deck.cards.filter((c) => c.suit === suit) : deck.cards
    const uniqueRanks = new Hand(filtered.filter((c, idx, arr) => {
      return idx === arr.findIndex((card) => card.rank === c.rank)
    })).sort()
    straightCards = straightCards.concat(uniqueRanks.cards)
  }
  for (let i = 0; i < straightCards.length - 5; i += 1) {
    const seq = straightCards.slice(i, i + 5);
    if (isStraightSeq(seq)) {
      return seq
    }
  }
  return []
}

export const getRandomHand = (deck: Deck = new Deck(), c: COMBOS = COMBOS.SINGLE, fullHand: FULL_HAND_TYPES = FULL_HAND_TYPES.FLUSH): Hand | undefined => {
  const combo = CardCombo[c]
  let hand;

  if (c !== COMBOS.FULL_HAND) {
    hand = getSpecificHand(deck, false, combo.count, combo.isValid)
    if (hand) deck.removeCards(hand.cards)
    return hand;
  }

  switch (fullHand) {
    case FULL_HAND_TYPES.STRAIGHT:
      deck.shuffle()
      const straight = findStraight(deck)
      hand = getSpecificHand(new Deck(straight), true, combo.count, FullHandCombo.STRAIGHT.isValid)
      break;
    case FULL_HAND_TYPES.FLUSH:
      hand = getSpecificHand(deck, true, combo.count, FullHandCombo.FLUSH.isValid)
      break;
    case FULL_HAND_TYPES.FULL_HOUSE:
      const double = getSpecificHand(deck, false, CardCombo.PAIR.count, CardCombo.PAIR.isValid)
      const triple = getSpecificHand(deck, false, CardCombo.TRIPLE.count, CardCombo.TRIPLE.isValid)
      if (double && triple) {
        hand = new Hand(triple?.cards.concat(double?.cards))
      }
      break;
    case FULL_HAND_TYPES.FOUR_OF_A_KIND:
      const four = getSpecificHand(deck, false, 4, (h) => true)
      const single = getSpecificHand(deck, false, CardCombo.SINGLE.count, CardCombo.SINGLE.isValid)
      if (four && single) {
        const result = new Hand(four.cards.concat(single.cards))
        if (result && FullHandCombo.FOUR_OF_A_KIND.isValid(result)) {
          hand = result
          hand.type = FULL_HAND_TYPES.FOUR_OF_A_KIND

        }
      }
      break;
    case FULL_HAND_TYPES.STRAIGHT_FLUSH:
      const straightFlush = findStraight(deck, true)
      if (straightFlush.length === CardCombo.FULL_HAND.count) {
        hand = getSpecificHand(new Deck(straightFlush, false), true, combo.count, FullHandCombo.STRAIGHT_FLUSH.isValid)
      }
      break;
  }
  if (hand) deck.removeCards(hand.cards)
  return hand;
}

const getSpecificHand = (deck: Deck, suitMatters: boolean, count: number, isValidFx: (h: Hand) => boolean) => {
  const { suitCount, rankCount } = calculateDeckCount(deck)
  let cards: Card[] = [];

  if (suitMatters) {
    for (const suit of shuffle(Object.keys(suitCount))) {
      const { count: filteredCount, cards: filteredCards } = suitCount[suit]
      if (count <= filteredCount) cards = shuffle(filteredCards).slice(0, count)
      if (cards && !isEmpty(cards.length)) {
        break;
      }
    }
  } else {
    for (const rank of shuffle(Object.keys(rankCount))) {
      const { count: filteredCount, cards: filteredCards } = rankCount[rank]
      if (count <= filteredCount) cards = shuffle(filteredCards).slice(0, count)
      if (cards && !isEmpty(cards.length)) {
        break;
      }
    }
  }

  const hand = new Hand(cards.slice(0, count))
  if (isValidFx(hand)) {
    return hand;
  }
}

// returns which non-sequential combos are present in a player's hand (4 of a kind + flush)
export const findFullHandNonSequentialCombos = (hand: Hand) => {
  const result: SubCombo[] = []
  const reverseHand = hand.cards.reverse();
  const { rankCount, suitCount } = fullHandCount(hand);
  const fourCount = 4;

  for (const rank in rankCount) {
    const count = rankCount[rank];
    if (count === fourCount) {
      result.push(new SubCombo("",
        new Hand(
          reverseHand
            .filter((c) => c.rank === parseInt(rank))
            .slice(0, fourCount),
          FULL_HAND_TYPES.FOUR_OF_A_KIND
        ), FULL_HAND_TYPES.FOUR_OF_A_KIND
      ));
    }
  }


  for (const suit in suitCount) {
    const count = suitCount[suit];
    if (count === MAX_PLAYABLE_CARDS) {
      result.push(new SubCombo("",
        new Hand(
          reverseHand
            .filter((c) => c.suit === suit)
            .slice(0, MAX_PLAYABLE_CARDS), FULL_HAND_TYPES.FLUSH
        ),
        FULL_HAND_TYPES.FLUSH,
      ));
    }
  }
  return result;
};

export const buildNonSequentialCombos = (
  playerHand: Hand,
  existingCombos: { [type in COMBOS]?: SubCombo[] }
): SubCombo[] => {
  const partialHands = findFullHandNonSequentialCombos(playerHand);
  const singles = existingCombos[COMBOS.SINGLE] ? [...existingCombos[COMBOS.SINGLE].filter((c) => c.type == COMBOS.SINGLE)] : []
  const doubles = existingCombos[COMBOS.PAIR] ? [...existingCombos[COMBOS.PAIR].filter((c) => c.type == COMBOS.PAIR)] : []
  const triples = existingCombos[COMBOS.TRIPLE] ? [...existingCombos[COMBOS.TRIPLE].filter((c) => c.type === COMBOS.TRIPLE)] : []

  // look for full house combos
  if (doubles.length > 0 && triples.length > 0) {
    const maxDouble = doubles.length > 1 ? doubles.sort((a, b) => parseInt(a.rank) - parseInt(b.rank)).pop() : doubles.pop()
    const maxTriple = triples.length > 1 ? triples.sort((a, b) => parseInt(a.rank) - parseInt(b.rank)).pop() : triples.pop()
    if (maxDouble && maxTriple) {
      const fullHouse = new Hand(maxDouble.best(maxDouble.rank, 2).concat(maxTriple.best(maxTriple.rank, 3)), FULL_HAND_TYPES.FULL_HOUSE)
      partialHands.push(new SubCombo("", fullHouse, fullHouse.type))
    }
  }

  // handle four of a kind
  partialHands.filter((p) => p.type === FULL_HAND_TYPES.FOUR_OF_A_KIND).map((s) => {
    s.hand = s.hand.join(singles.pop()?.hand)
  })

  return partialHands.filter((p) => p.hand.cards.length === MAX_PLAYABLE_CARDS)
};

export const logMessage = (message: string) => {
  console.log(SEPARATOR + message + SEPARATOR);
};
