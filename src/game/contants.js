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

export const CARD_COMBOS = {
  SINGLE: {
    count: 1,
    valid: (h) => {
      return h.cards.length === 1;
    },
    comparison: (a, b) => {
      a.rank - b.rank;
    },
  },
  PAIR: {
    count: 2,
    valid: (h) => {
      return h.cards.length === 2 && [...new Set(h.rank())].length == 1;
    },
    comparison: (a, b) => {
      a.rank - b.rank;
    },
  },
  TRIPLE: {
    count: 3,
    valid: (h) => {
      return h.cards.length === 3 && [...new Set(h.rank())].length == 1;
    },
  },
  FULL_HAND: {
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

export const FULL_HAND_COMBO = {
  STRAIGHT: { valid: (h) => isStraight(h) },
  FLUSH: { valid: (h) => isFlush(h) },
  FULL_HOUSE: { valid: (h) => isFullHouse(h) },
  FOUR_OF_A_KIND: { valid: (h) => isFourOfAKind(h) },
  STRAIGHT_FLUSH: { valid: (h) => isFlush(h) && isStraight(h) },
};

const isSequential = (a, b) => b - a === 1;

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

const isFlush = (hand) => {
  return [...new Set(hand.suit())].length === 1;
};

const isFullHouse = (hand) => {
  const counts = calculateHandCount(hand);
  return findHandCount(hand, counts, 3) && findHandCount(hand, counts, 2);
};

const isFourOfAKind = (hand) => {
  const atMostTwoSuits = [...new Set(hand.suit())].length < 3;
  if (!atMostTwoSuits) {
    return false;
  }

  return findHandCount(hand, calculateHandCount(hand), 4);
};

const calculateHandCount = (hand) => {
  const counts = {};
  for (const int of hand.rank()) {
    if (int in counts) {
      counts[int]++;
    } else {
      counts[int] = 1;
    }
  }
  return counts;
};

const findHandCount = (hand, counts, desiredCount) => {
  for (const int of Object.values(counts)) {
    if (int === desiredCount) return true;
  }

  return false;
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
