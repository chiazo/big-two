import assert from "node:assert";
import { describe, it } from "node:test";
import { Card } from "../game/card";
import { CardSuit } from "../game/constants";

describe("use cases", () => {
    it("returns lowest numeral card", () => {
        const suit = CardSuit.DIAMONDS;
        const rank = 3;
        const c = new Card(suit.toString(), suit.symbol, rank)
        hasExpectedValues(c, suit, rank)
    });

    it("returns highest numeral card", () => {
        const suit = CardSuit.SPADES;
        const rank = 2;
        const c = new Card(suit.toString(), suit.symbol, rank)
        hasExpectedValues(c, suit, rank)
    });

    it("returns lowest face card", () => {
        const suit = CardSuit.DIAMONDS;
        const rank = 11;
        const c = new Card(suit.toString(), suit.symbol, rank)
        hasExpectedValues(c, suit, rank, true)
    });

    it("returns highest face card", () => {
        const suit = CardSuit.SPADES;
        const rank = 13;
        const c = new Card(suit.toString(), suit.symbol, rank)
        hasExpectedValues(c, suit, rank, true)
    });
});

const hasExpectedValues = (c: Card, suit: CardSuit, rank: number, isFaceCard: boolean = false) => {
    assert.strictEqual(c.rank, rank)
    assert.strictEqual(c.suit, suit.toString())
    assert.strictEqual(c.symbol, suit.symbol)
    if (isFaceCard) {
        assert.ok(c.faceCard)
    } else {
        assert.ok(!c.faceCard)
    }
}