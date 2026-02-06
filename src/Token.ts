import { TokenOptions } from './TokenOptions';
import * as jwt from "jsonwebtoken";
import * as fs from 'fs';

export class AuthToken {
  private keyData: string | Buffer;

  constructor(private options: TokenOptions) {
    if (!options.teamId || !/^[A-Z0-9]{10}$/i.test(options.teamId)) {
      throw new Error('teamId must be a 10-character alphanumeric string');
    }
    if (!options.keyId || !/^[A-Z0-9]{10}$/i.test(options.keyId)) {
      throw new Error('keyId must be a 10-character alphanumeric string');
    }
    this.keyData = this.getKeyData(options);
  }

  getKeyData(options: TokenOptions) {
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