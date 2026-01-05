import assert from "node:assert";
import { last } from "underscore";
import { Card } from "../game/card";
import {
    CardCombo,
    getDesiredHand,
    getSpecificHand,
    sortCards,
} from "../game/common";
import { CardSuit, COMBOS, FULL_HAND_TYPES } from "../game/constants";
import { Deck } from "../game/deck";
import { Hand } from "../game/hand";

const defaultFilter = (c: Card, h: Hand) => true;

export const getSpecificHandAndRank = (
    d: Deck,
    c: CardCombo,
    r: number,
    s: CardSuit | undefined = undefined
) => {
    return getSpecificHand(d, !!s, c.count, (h) => true, r, s);
};
export const verifyHand = (
    c: COMBOS,
    f: FULL_HAND_TYPES | undefined = undefined,
    maxFilter: (card: Card, hand: Hand) => boolean = defaultFilter
) => {
    const hand = getDesiredHand(new Deck(), c, f);
    const combo = CardCombo[c];

    assert(hand);
    assert.strictEqual(hand.type, f ? f : c.toString());
    assert.strictEqual(hand.count(), combo.count);

    const sortedCards = hand.cards
        .filter((c) => maxFilter(c, hand))
        .sort(sortCards);
    assert(sortCards.length > 0);
    const max = last(sortedCards);

    assert(max);
    assert.strictEqual(hand.max(), max);
};
