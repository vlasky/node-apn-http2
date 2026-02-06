"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthToken = void 0;
const jwt = require("jsonwebtoken");
const fs = require("fs");
class AuthToken {
    constructor(options) {
        this.options = options;
        if (!options.teamId || !/^[A-Z0-9]{10}$/i.test(options.teamId)) {
            throw new Error('teamId must be a 10-character alphanumeric string');
        }
        if (!options.keyId || !/^[A-Z0-9]{10}$/i.test(options.keyId)) {
            throw new Error('keyId must be a 10-character alphanumeric string');
        }
        this.keyData = this.getKeyData(options);
    }
    getKeyData(options) {
        if (!options.key) {
            throw new Error('key is required');
        }
        if (typeof options.key === 'string' && /-----BEGIN ([A-Z\s*]+)-----/.test(options.key)) {
            return options.key;
        }
        else if (Buffer.isBuffer(options.key)) {
            return options.key;
        }
        else {
            return fs.readFileSync(options.key);
        }
    }
    generate() {
        return jwt.sign({}, this.keyData, {
            algorithm: "ES256",
            issuer: this.options.teamId,
            header: {
                alg: "ES256",
                kid: this.options.keyId
            }
        });
    }
}
exports.AuthToken = AuthToken;
//# sourceMappingURL=Token.js.map