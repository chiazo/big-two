import assert from "node:assert";
import { describe, it } from "node:test";
import { Card } from "../game/card";
import { Deck } from "../game/deck";
import { CardSuit, RANKS } from "../game/constants";
import { first, isEmpty, last } from "underscore";
import { DECK_SIZE } from "../game/common";

describe("deck.test.ts", () => {
    const lowestCard = new Card(CardSuit.DIAMONDS.toString(), CardSuit.DIAMONDS.symbol, 3)
    const highestCard = new Card(CardSuit.SPADES.toString(), CardSuit.SPADES.symbol, 2)

    describe("use cases", () => {
        it("returns standard shuffled deck", () => {
            const deck = new Deck();
            const expectedSize = 52

            assert.strictEqual(deck.size, expectedSize)
            assert(deck.cards.length === expectedSize)
            const originalCardOrder = [...deck.cards]

            deck.shuffle()
            assert.notStrictEqual(first(deck.cards)?.toString(), first(originalCardOrder)?.toString())

            deck.sort()
            assert.strictEqual(first(deck.cards)?.toString(), lowestCard.toString())
            assert.strictEqual(last(deck.cards)?.toString(), highestCard.toString())

            deck.removeCards(originalCardOrder)
            assert(isEmpty(deck.cards))
            assert.strictEqual(deck.size, 0)

        });

        it("returns standard unshuffled deck", () => {
            const deck = new Deck(false);
            const expectedFirst = new Card(CardSuit.DIAMONDS.toString(), CardSuit.DIAMONDS.symbol, RANKS.NUMERAL_CARDS.MIN.value)
            const expectedLast = new Card(CardSuit.SPADES.toString(), CardSuit.SPADES.symbol, RANKS.FACE_CARDS.KING)

            assert.strictEqual(first(deck.cards)?.toString(), expectedFirst.toString())
            assert.strictEqual(last(deck.cards)?.toString(), expectedLast.toString())

            deck.sort()
            assert.strictEqual(first(deck.cards)?.toString(), lowestCard.toString())
            assert.strictEqual(last(deck.cards)?.toString(), highestCard.toString())

            deck.removeCards([lowestCard, highestCard])
            assert(!deck.has(lowestCard))
            assert(!deck.has(highestCard))
            assert.strictEqual(deck.size, 50)

        });
    });

    describe("edge cases", () => {
        it("throws if card count is not standard", () => {
            const cards: Card[] = Array(DECK_SIZE + 1).fill(lowestCard)
            assert.throws(() => new Deck(true, cards))
        });
    });
})
