
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
