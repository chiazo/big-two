import { Hand } from "./hand.js";

export const DECK_SIZE = 52;
export const MAX_PLAYERS = 4;
export const MAX_PLAYABLE_CARDS = 5;
export const RANK_COUNT = 13;
export const SEPARATOR =
  "\n=============================================================================\n";

export const SUITS = {
  CLUBS: {
    name: "CLUBS",
    symbol: "♣",
  },
  DIAMONDS: {
    name: "DIAMONDS",
    symbol: "♦",
  },
  HEARTS: {
    name: "HEARTS",
    symbol: "♥",
  },
  SPADES: { name: "SPADES", symbol: "♠" },
};

export const COMBOS = {
  SINGLE: "SINGLE",
  PAIR: "PAIR",
  TRIPLE: "TRIPLE",
  FULL_HAND: "FULL_HAND",
};

export const CARD_COMBOS = {
  [COMBOS.SINGLE]: {
    count: 1,
    valid: (h) => {
      h.type = COMBOS.SINGLE;
      return h.cards.length === 1;
    },
    comparison: (a, b) => {
      a.rank - b.rank;
    },
  },
  [COMBOS.PAIR]: {
    count: 2,
    valid: (h) => {
      h.type = COMBOS.PAIR;
      return h.cards.length === 2 && [...new Set(h.rank())].length == 1;
    },
    comparison: (a, b) => {
      a.rank - b.rank;
    },
  },
  [COMBOS.TRIPLE]: {
    count: 3,
    valid: (h) => {
      h.type = COMBOS.TRIPLE;
      return h.cards.length === 3 && [...new Set(h.rank())].length == 1;
    },
  },
  [COMBOS.FULL_HAND]: {
    count: 5,
    valid: (h) => {
      const [[type]] = Object.entries(FULL_HAND_COMBO).filter(([, f]) => {
        return f.valid(h);
      });
      h.type = type;
      return h.cards.length === 5 && type !== null;
    },
  },
};

export const FULL_HAND_TYPES = {
  STRAIGHT: "STRAIGHT",
  FLUSH: "FLUSH",
  FULL_HOUSE: "FULL_HOUSE",
  FOUR_OF_A_KIND: "FOUR_OF_A_KIND",
  STRAIGHT_FLUSH: "STRAIGHT_FLUSH",
};

export const FULL_HAND_COMBO = {
  [FULL_HAND_TYPES.STRAIGHT]: { sequential: true, valid: (h) => isStraight(h) },
  [FULL_HAND_TYPES.FLUSH]: { sequential: false, valid: (h) => isFlush(h) },
  [FULL_HAND_TYPES.FULL_HOUSE]: {
    sequential: false,
    valid: (h) => isFullHouse(h),
  },
  [FULL_HAND_TYPES.FOUR_OF_A_KIND]: {
    sequential: false,
    valid: (h) => isFourOfAKind(h),
  },
  [FULL_HAND_TYPES.STRAIGHT_FLUSH]: {
    sequential: true,
    valid: (h) => isFlush(h) && isStraight(h),
  },
};

const isSequential = (a, b) => b - a === 1;

const getMaxHand = (a, b) => {
  return Math.max(a.hand.max().rank, b.hand.max().rank) === a.hand.max()
    ? a
    : b;
};

// Five cards of any suit in order
const isStraight = (hand) => {
  const sequence = hand.rank().reduce(
    (results, card) => {
      results.comparison.push(isSequential(results.prevCard, card));
      results.numbers.push(card);
      return {
        ...results,
        prevCard: card,
      };
    },
    { prevCard: hand.rank()[0] - 1, comparison: [], numbers: [] }
  );
  const result = [...new Set(sequence.comparison)];
  return result.length === 1 && result[0];
};

// Five cards of the same suit, irrespective of rank
const isFlush = (hand) => {
  return [...new Set(hand.suit())].length === 1;
};

// A triple and a pair
const isFullHouse = (hand) => {
  const counts = calculateHandCount(hand);
  return (
    findHandCount(counts, CARD_COMBOS[COMBOS.TRIPLE].count) &&
    findHandCount(counts, CARD_COMBOS[COMBOS.PAIR].count)
  );
};

// Four cards of the same rank and one random card
const isFourOfAKind = (hand) => {
  const atMostTwoSuits = [...new Set(hand.suit())].length < 3;
  if (!atMostTwoSuits) {
    return false;
  }

  return findHandCount(calculateHandCount(hand), 4);
};

// counts the unique number of cards for a specific rank or suit in a hand
export const calculateHandCount = (hand, isRankCount = true) => {
  const counts = {};
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

// filters on whether the explict count desired is represented in a given hand
const findHandCount = (counts, desiredCount) => {
  for (const [rank, count] of Object.entries(counts)) {
    if (count === desiredCount) return rank;
  }

  return "";
};

// returns unique count of each rank and suit
export const fullHandCount = (hand) => {
  return {
    rankCount: calculateHandCount(hand),
    suitCount: calculateHandCount(hand, false),
  };
};

// returns which non-sequential combos are present in a player's hand
export const findFullHandNonSequentialCombos = (hand, fullHand) => {
  const reverseHand = hand.cards.reverse();
  const { rankCount, suitCount } = fullHandCount(hand);
  const fourOfAKind = {
    fours: [],
    type: FULL_HAND_TYPES.FOUR_OF_A_KIND,
  };
  const fullHouse = {
    triples: [],
    doubles: [],
    type: FULL_HAND_TYPES.FULL_HOUSE,
  };
  const fourCount = 4;
  const tripleCount = 3;
  const doubleCount = 2;

  for (const rank in rankCount) {
    const count = rankCount[rank];
    if (count === fourCount) {
      fourOfAKind.fours.push(
        new Hand(
          reverseHand
            .filter((c) => c.rank === parseInt(rank))
            .slice(0, fourCount)
        )
      );
    }
    if (count === tripleCount) {
      fullHouse.triples.push({
        hand: new Hand(
          reverseHand
            .filter((c) => c.rank === parseInt(rank))
            .slice(0, tripleCount)
        ),
      });
    }
    if (count === doubleCount) {
      fullHouse.doubles.push({
        hand: new Hand(
          reverseHand
            .filter((c) => c.rank === parseInt(rank))
            .slice(0, doubleCount)
        ),
      });
    }
  }

  if (fourOfAKind.fours.length > 0) {
    fullHand.push(fourOfAKind);
  }

  if (fullHouse.doubles.length > 0 && fullHouse.triples.length > 0) {
    fullHand.push(fullHouse);
  }
  for (const suit in suitCount) {
    const count = suitCount[suit];
    if (count === MAX_PLAYABLE_CARDS) {
      fullHand.push({
        hand: new Hand(
          reverseHand
            .filter((c) => c.suit === suit)
            .slice(0, MAX_PLAYABLE_CARDS)
        ),
        type: FULL_HAND_TYPES.FLUSH,
      });
    }
  }
};

export const buildNonSequentialCombos = (hand, fullHand, existingCombos) => {
  findFullHandNonSequentialCombos(hand, fullHand);
  const maxSingle = Math.max(
    ...existingCombos[COMBOS.SINGLE].map(({ rank }) => parseInt(rank))
  );
  fullHand.forEach((combo) => {
    const { hand, fours, triples, doubles, type } = combo;
    if (type == FULL_HAND_TYPES.FULL_HOUSE) {
      const { hand: maxTriple } = triples.reduce(getMaxHand);
      const { hand: maxDouble } = doubles.reduce(getMaxHand);
      const fullHouse = maxTriple.join(maxDouble);
      combo.hand = fullHouse;
    }

    if (type == FULL_HAND_TYPES.FOUR_OF_A_KIND) {
      const { hand: maxFour } = fours.reduce(getMaxHand);
      console.log(`fours`, fours);
      console.log(`combo`, combo);
      const fourOfAKind = maxFour.join(
        new Hand(hand.cards.filter((c) => c.rank === maxSingle))
      );
      combo.hand = fourOfAKind;
    }
  });
};

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

export const logMessage = (message) => {
  console.log(SEPARATOR + message + SEPARATOR);
};
