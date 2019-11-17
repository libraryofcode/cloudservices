import crypto from 'crypto';
import { Request } from 'express';
import { Client } from '..';
import { AccountInterface } from '../models';

export default class Security {
  public client: Client;

  private keyBase: { key: string, iv: string };

  constructor(client: Client) {
    this.client = client;
    this.keyBase = require(`${process.cwd()}/keys.json`);
  }

  get keys() {
    return {
      key: Buffer.from(this.keyBase.key, 'base64'),
      iv: Buffer.from(this.keyBase.iv, 'base64'),
    };
  }

  /**
   * Creates a new Bearer token.
   * @param _id The Mongoose Document property labeled ._id
   */
  public async createBearer(_id: string): Promise<string> {
    const account = await this.client.db.Account.findOne({ _id });
    if (!account) throw new Error(`Account [${_id}] cannot be found.`);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.keys.key, this.keys.iv);
    let encrypted = cipher.update(JSON.stringify(account), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  public async checkBearer(bearer: string): Promise<null | AccountInterface> {
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.keys.key, this.keys.iv);
    try {
      let decrypted = decipher.update(bearer, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      const json = JSON.parse(decrypted);
      const account = await this.client.db.Account.findOne({ username: json.username });
      return account;
    } catch {
      return null;
    }
  }

  public extractBearer(req: Request): string {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    }
    if (req.query && req.query.token) {
      return req.query.token;
    }
    return 'null';
  }
}
