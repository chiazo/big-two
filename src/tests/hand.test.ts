import assert from "node:assert";
import { describe, it } from "node:test";
import { isEmpty } from "underscore";
import {
    calculateHandCount,
    CardCombo,
    findHandCount,
    getDesiredHand
} from "../game/common";
import { verifyHand, getSpecificHandAndRank } from "./common"
import { CardSuit, COMBOS, FULL_HAND_TYPES } from '../game/constants';
import { Deck } from "../game/deck";
import { Hand } from "../game/hand";

describe("hand.test.ts", () => {
    const deck = new Deck();
    describe("use cases", () => {
        describe("single", () => {
            verifyHand(COMBOS.SINGLE);
            it("beats other single", () => {
                const ace = getSpecificHandAndRank(deck, CardCombo.SINGLE, 1)
                const king = getSpecificHandAndRank(deck, CardCombo.SINGLE, 13)
                const two = getSpecificHandAndRank(deck, CardCombo.SINGLE, 2)
                assert(ace && king && two && ace.beats(king) && two.beats(ace) && two.beats(king))
            })
            it("two of spades beats another two", () => {
                const twoOfSpades = getSpecificHandAndRank(deck, CardCombo.SINGLE, 2, CardSuit.SPADES)
                const twoOfHearts = getSpecificHandAndRank(deck, CardCombo.SINGLE, 2, CardSuit.HEARTS)
                assert(twoOfSpades && twoOfHearts && twoOfSpades.beats(twoOfHearts))
            })
        });
        describe("double", () => {
            verifyHand(COMBOS.PAIR);
        });
        describe("triple", () => {
            verifyHand(COMBOS.TRIPLE);
        });
        describe("straight", () => {
            verifyHand(COMBOS.FULL_HAND, FULL_HAND_TYPES.STRAIGHT);
        });
        describe("flush", () => {
            verifyHand(COMBOS.FULL_HAND, FULL_HAND_TYPES.FLUSH);
        });
        describe("full house", () => {
            verifyHand(
                COMBOS.FULL_HAND,
                FULL_HAND_TYPES.FULL_HOUSE,
                (c, h) => !isEmpty(findHandCount(calculateHandCount(h), 3))
            );
        });
        describe("four of a kind", () => {
            verifyHand(
                COMBOS.FULL_HAND,
                FULL_HAND_TYPES.FOUR_OF_A_KIND,
                (c, h) => !isEmpty(findHandCount(calculateHandCount(h), 4))
            );
        });
        describe("straight flush", () => {
            verifyHand(COMBOS.FULL_HAND, FULL_HAND_TYPES.STRAIGHT_FLUSH);
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
