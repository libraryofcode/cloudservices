import crypto from 'crypto';
import { Request } from 'express';
import { Client } from '..';

export default class Security {
  public client: Client;

  public keyPair: { publicKey: string, privateKey: string };

  constructor(client: Client) {
    this.client = client;
    this.keyPair = require(`${process.cwd()}/keys.json`);
  }

  /**
   * Creates a new Bearer token.
   * @param _id The Mongoose Document property labeled ._id
   */
  public async createBearer(_id: string): Promise<string> {
    const account = await this.client.db.Account.findOne({ _id });
    if (!account) throw new Error(`Account [${_id}] cannot be found.`);
    const bearer = crypto.randomBytes(12);
    const sign = crypto.createSign('sha3-224');
    sign.update(bearer);
    sign.end();
    const signature = sign.sign(this.keyPair.privateKey, 'hex');
    await account.updateOne({ bearerSignature: signature });
    return bearer.toString('base64');
  }

  public async checkBearer(_id: string, bearer: string): Promise<boolean> {
    const account = await this.client.db.Account.findOne({ _id });
    if (!account) return false;
    if (!account.bearerSignature) return false;
    const verify = crypto.createVerify('sha3-224');
    verify.update(bearer);
    verify.end();
    try {
      return verify.verify(this.keyPair.publicKey, account.bearerSignature, 'base64');
    } catch {
      return false;
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
