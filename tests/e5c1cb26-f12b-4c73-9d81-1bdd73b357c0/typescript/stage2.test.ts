//@ts-nocheck
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import { describe, expect, test, beforeAll } from "bun:test";

// Import the solution file
import { createBitcoinAddress } from "./main";

describe("Bitcoin Address Generation - Stage 1", () => {
  let ECPair: ReturnType<typeof ECPairFactory>;

  beforeAll(() => {
    ECPair = ECPairFactory(ecc);
  });

  test("should generate a valid Bitcoin address", () => {
    const address = createBitcoinAddress();

    // Test if address is a string
    expect(typeof address).toBe("string");

    // Test if address has correct length (26-35 characters)
    expect(address.length).toBeGreaterThanOrEqual(26);
    expect(address.length).toBeLessThanOrEqual(35);

    // Test if address starts with correct prefix (1 or 3)
    expect(["1", "3"]).toContain(address.charAt(0));
  });

  test("should generate unique addresses on each call", () => {
    const address1 = createBitcoinAddress();
    const address2 = createBitcoinAddress();

    expect(address1).not.toBe(address2);
  });

  test("should generate address from valid public key", () => {
    // Create a known keypair for testing
    const keyPair = ECPair.makeRandom();
    const { address: expectedAddress } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
    });

    // Mock the ECPair.makeRandom to return our test keypair
    const originalMakeRandom = ECPair.makeRandom;
    ECPair.makeRandom = () => keyPair;

    const generatedAddress = createBitcoinAddress();

    // Restore original makeRandom function
    ECPair.makeRandom = originalMakeRandom;

    expect(generatedAddress).toBe(expectedAddress ?? "");
  });

  test("should use p2pkh format", () => {
    const address = createBitcoinAddress();

    try {
      // Attempt to decode the address
      const decoded = bitcoin.address.fromBase58Check(address);
      // Check if it's a p2pkh address (version 0x00)
      expect(decoded.version).toBe(0x00);
    } catch (error) {
      throw new Error("Invalid Bitcoin address format");
    }
  });
});
