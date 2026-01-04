import assert from "node:assert";
import { describe, it } from "node:test";
import { last, isEmpty } from 'underscore';
import { CardCombo, getDesiredHand, sortCards, findHandCount, calculateHandCount } from '../game/common';
import { COMBOS, FULL_HAND_TYPES } from "../game/constants";
import { Deck } from "../game/deck";
import { Hand } from "../game/hand";
import { Card } from "../game/card";

describe("hand.test.ts", () => {
    const deck = new Deck();
    describe("use cases", () => {
        it("single", () => {
            verifyHand(COMBOS.SINGLE)
        });
        it("double", () => {
            verifyHand(COMBOS.PAIR)
        });
        it("triple", () => {
            verifyHand(COMBOS.TRIPLE)
        });
        it("straight", () => {
            verifyHand(COMBOS.FULL_HAND, FULL_HAND_TYPES.STRAIGHT)
        });
        it("flush", () => {
            verifyHand(COMBOS.FULL_HAND, FULL_HAND_TYPES.FLUSH)
        });
        it("full house", () => {
            verifyHand(COMBOS.FULL_HAND, FULL_HAND_TYPES.FULL_HOUSE, (c, h) => !isEmpty(findHandCount(calculateHandCount(h), 3)))
        });
        it("four of a kind", () => {
            verifyHand(COMBOS.FULL_HAND, FULL_HAND_TYPES.FOUR_OF_A_KIND, (c, h) => !isEmpty(findHandCount(calculateHandCount(h), 4)))
        });
        it("straight flush", () => {
            verifyHand(COMBOS.FULL_HAND, FULL_HAND_TYPES.STRAIGHT_FLUSH)
        });
    });
})

const defaultFilter = (c: Card, h: Hand) => true
const verifyHand = (c: COMBOS, f: FULL_HAND_TYPES | undefined = undefined, maxFilter: (card: Card, hand: Hand) => boolean = defaultFilter) => {
    const hand = getDesiredHand(new Deck(), c, f)
    const combo = CardCombo[c]

    assert(hand)
    assert.strictEqual(hand.type, f ? f : c.toString())
    assert.strictEqual(hand.count(), combo.count)

    const max = last(hand.cards.filter((c) => maxFilter(c, hand)).sort(sortCards))
    assert(max)
    assert.strictEqual(hand.max(), max)
}