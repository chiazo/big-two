export const DECK_SIZE = 52;
export const MAX_PLAYERS = 4;
export const RANK_COUNT = 13;
export const SEPARATOR =
  "\n=============================================================================\n";

export const SUITS = {
  CLUBS: "CLUBS",
  DIAMONDS: "DIAMONDS",
  HEARTS: "HEARTS",
  SPADES: "SPADES",
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
