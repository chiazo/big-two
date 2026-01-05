import assert from "node:assert";
import { describe, it } from "node:test";
import { isEmpty } from "underscore";
import {
    calculateHandCount,
    CardCombo,
    findHandCount,
    FullHandCombo,
    getDesiredHand
} from "../game/common";
import { verifyHand, getSpecificHandAndRank } from "./common"
import { CardSuit, COMBOS, FULL_HAND_TYPES } from '../game/constants';
import { Deck } from "../game/deck";
import { Hand } from "../game/hand";

describe("hand.test.ts", () => {
    describe("use cases", () => {
        describe("single", () => {
            it("verifies random hand", () => {
                verifyHand(COMBOS.SINGLE);
            })
            it("beats other single", () => {
                verifyHandBeatsAnother(CardCombo.SINGLE)
            })
            it("two of spades beats another two", () => {
                verifyTwoWins(CardCombo.SINGLE)
            })
        });
        describe("double", () => {
            it("verifies random hand", () => {
                verifyHand(COMBOS.PAIR);
            })
            it("beats other pair", () => {
                verifyHandBeatsAnother(CardCombo.PAIR)
            })
            it("pair with two of spades beats another pair of twos", () => {
                verifyTwoWins(CardCombo.PAIR)
            })
        });
        describe("triple", () => {
            it("verifies random hand", () => {
                verifyHand(COMBOS.TRIPLE);
            })
            it("beats other triple", () => {
                verifyHandBeatsAnother(CardCombo.TRIPLE)
            })
            it("triple with two of spades beats another triple of twos", () => {
                verifyTwoWins(CardCombo.TRIPLE)
            })
        });
        describe("straight", () => {
            it("verifies random hand", () => {
                verifyHand(COMBOS.FULL_HAND, FULL_HAND_TYPES.STRAIGHT);
            })
        });
        describe("flush", () => {
            it("verifies random hand", () => {
                verifyHand(COMBOS.FULL_HAND, FULL_HAND_TYPES.FLUSH);
            })
            it("beats a straight", () => {
                verifyFullHandBeatsAnother(FULL_HAND_TYPES.FLUSH, FULL_HAND_TYPES.STRAIGHT)
            })
        });
        describe("full house", () => {
            it("verifies random hand", () => {
                verifyHand(
                    COMBOS.FULL_HAND,
                    FULL_HAND_TYPES.FULL_HOUSE,
                    (c, h) => Object.entries(calculateHandCount(h)).some(([key, val]) => val === 3 && parseInt(key) === c.rank)
                );
            })
            it("beats a straight", () => {
                verifyFullHandBeatsAnother(FULL_HAND_TYPES.FULL_HOUSE, FULL_HAND_TYPES.STRAIGHT)
            })
            it("beats a flush", () => {
                verifyFullHandBeatsAnother(FULL_HAND_TYPES.FULL_HOUSE, FULL_HAND_TYPES.FLUSH)
            })

        });
        describe("four of a kind", () => {
            it("verifies random hand", () => {
                verifyHand(
                    COMBOS.FULL_HAND,
                    FULL_HAND_TYPES.FOUR_OF_A_KIND,
                    (c, h) => !isEmpty(findHandCount(calculateHandCount(h), 4))
                );
            })
            it("beats a straight", () => {
                verifyFullHandBeatsAnother(FULL_HAND_TYPES.FOUR_OF_A_KIND, FULL_HAND_TYPES.STRAIGHT)
            })
            it("beats a flush", () => {
                verifyFullHandBeatsAnother(FULL_HAND_TYPES.FOUR_OF_A_KIND, FULL_HAND_TYPES.FLUSH)
            })
            it("beats a full house", () => {
                verifyFullHandBeatsAnother(FULL_HAND_TYPES.FOUR_OF_A_KIND, FULL_HAND_TYPES.FULL_HOUSE)
            })

        });
        describe("straight flush", () => {
            it("verifies random hand", () => {
                verifyHand(COMBOS.FULL_HAND, FULL_HAND_TYPES.STRAIGHT_FLUSH);
            })
            it("beats a straight", () => {
                verifyFullHandBeatsAnother(FULL_HAND_TYPES.STRAIGHT_FLUSH, FULL_HAND_TYPES.STRAIGHT)
            })
            it("beats a flush", () => {
                verifyFullHandBeatsAnother(FULL_HAND_TYPES.STRAIGHT_FLUSH, FULL_HAND_TYPES.FLUSH)
            })
            it("beats a full house", () => {
                verifyFullHandBeatsAnother(FULL_HAND_TYPES.STRAIGHT_FLUSH, FULL_HAND_TYPES.FULL_HOUSE)
            })
            it("beats a four of a kind", () => {
                verifyFullHandBeatsAnother(FULL_HAND_TYPES.STRAIGHT_FLUSH, FULL_HAND_TYPES.FOUR_OF_A_KIND)
            })
        });
    });

    describe("edge cases", () => {
        it("throws if max called on empty hand", () => {
            assert.throws(() => new Hand([]).max(), (err: Error) => { assert.strictEqual(err.message, "max is invalid for this hand."); return true; });
        });
        it("throws if max called on empty full house hand", () => {
            assert.throws(() => {
                const h = new Hand([])
                h.type = FULL_HAND_TYPES.FULL_HOUSE
                h.max()
            }, (err: Error) => { assert.strictEqual(err.message, "max full house is invalid for this hand."); return true; });
        });
        it("throws if join exceeds hand card limit", () => {
            assert.throws(() => {
                getDesiredHand(new Deck(), COMBOS.TRIPLE)?.join(getDesiredHand(new Deck(), COMBOS.TRIPLE))
            }, (err: Error) => { assert.strictEqual(err.message, "cannot merge hands and exceed 5 cards"); return true; });
        });
        it("throws if join involves overlapping cards", () => {
            assert.throws(() => {
                const handOne = getDesiredHand(new Deck(), COMBOS.PAIR)
                assert(handOne)

                const handTwo = new Hand([...handOne.cards])
                handOne.join(handTwo)
            }, (err: Error) => { assert.strictEqual(err.message, "cannot merge hands that have overlapping cards"); return true; });
        });
    });
});

const verifyHandBeatsAnother = (c: CardCombo) => {
    const deck = new Deck();
    const ace = getSpecificHandAndRank(deck, c, 1)
    const king = getSpecificHandAndRank(deck, c, 13)
    const two = getSpecificHandAndRank(deck, c, 2)
    const result = ace && king && two && ace.beats(king) && two.beats(ace) && two.beats(king)
    assert(result)
}

const verifyFullHandBeatsAnother = (a: FULL_HAND_TYPES, b: FULL_HAND_TYPES | undefined = undefined): void => {
    const deck = new Deck();
    const c = COMBOS.FULL_HAND

    if (b) {
        const one = a === FULL_HAND_TYPES.FULL_HOUSE ? getSpecificHandAndRank(deck, CardCombo.TRIPLE, 13)?.join(getDesiredHand(deck, COMBOS.PAIR)) : getDesiredHand(deck, c, a, 2)
        const two = b === FULL_HAND_TYPES.FULL_HOUSE ? getSpecificHandAndRank(deck, CardCombo.TRIPLE, 12)?.join(getDesiredHand(deck, COMBOS.PAIR)) : getDesiredHand(deck, c, b, 2)
        assert(one && two && one.beats(two))
        return;
    }
    const ace = a === FULL_HAND_TYPES.FULL_HOUSE ? getSpecificHandAndRank(deck, CardCombo.TRIPLE, 1)?.join(getDesiredHand(deck, COMBOS.PAIR)) : getDesiredHand(deck, c, a, 1)
    const king = b === FULL_HAND_TYPES.FULL_HOUSE ? getSpecificHandAndRank(deck, CardCombo.TRIPLE, 13)?.join(getDesiredHand(deck, COMBOS.PAIR)) : getDesiredHand(deck, c, a, 13)
    const result = ace && king && ace.beats(king)

    assert(result)
}

const verifyTwoWins = (c: CardCombo) => {
    const deck = new Deck();
    const twoOfSpades = getSpecificHandAndRank(deck, c, 2, CardSuit.SPADES)
    const twoOfHearts = getSpecificHandAndRank(deck, c, 2, CardSuit.HEARTS)
    const result = twoOfSpades && twoOfHearts && twoOfSpades.beats(twoOfHearts)
    assert(result)
}
