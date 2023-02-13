import {sign, validate} from "../src/security/tokens.mjs";
import assert from "assert";
import {check, hash} from "../src/security/verifiers.mjs";

describe('Tokens test', function () {
    it('Encrypt and verify', function () {
        const data = { example: 'test' };
        const hashed = sign(data);
        const deHashed = validate(hashed);

        for (const key in data)
            assert.strictEqual(data[key], deHashed[key]);
    });
});

describe('Transaction hashes', function () {
    // Generates a hash for signing some transaction data, and checks that it's valid
    it('Hash and verify', function () {
        const data = { example: 'test', example2: 'some example data' };
        const hashed = hash(data);
        const isValid = check(hashed);
        assert.ok(isValid);
    });
});
