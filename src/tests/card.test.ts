import assert from "node:assert";
import { describe, it } from "node:test";
import { Card } from "../game/card";
import { CardSuit } from "../game/constants";

describe("card.test.ts", () => {
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

    describe("edge cases", () => {
        it("throws if rank exceeds lower limit", () => {
            assertThrows(CardSuit.DIAMONDS.toString(), CardSuit.DIAMONDS.symbol, 0)
        });

        it("throws if rank exceeds upper limit", () => {
            assertThrows(CardSuit.DIAMONDS.toString(), CardSuit.DIAMONDS.symbol, 14)
        });

        it("throws if suit does not exist", () => {
            assertThrows("INVALID_SUIT", CardSuit.DIAMONDS.symbol, 3)
        });

        it("throws if symbol does not exist", () => {
            assertThrows(CardSuit.DIAMONDS.toString(), "INVALID_SYMBOL", 3)
        });
    });
})

const hasExpectedValues = (c: Card, suit: CardSuit, rank: number, isFaceCard: boolean = false) => {
    assert.strictEqual(c.rank, rank)
    assert.strictEqual(c.suit, suit.toString())
    assert.strictEqual(c.symbol, suit.symbol)
    assert.strictEqual(isFaceCard, c.faceCard)
    if (c.faceCard) {
        assert(c.name)
    } else {
        assert(!c.name)
    }
}

const assertThrows = (suit: string, symbol: string, rank: number) => {
    assert.throws(() => new Card(suit, symbol, rank), (err: Error) => {
        assert(err instanceof RangeError)
        assert.strictEqual(err.message, `${rank} of ${symbol} is invalid`)
        return true
    })
}