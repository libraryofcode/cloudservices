import { Document, Schema, model } from 'mongoose';
import { AccountInterface } from './Account';

export interface DomainInterface extends Document {
  account: AccountInterface,
  domain: string,
  port: number,
  // Below is the full absolute path to the location of the x509 certificate and key files.
  x509: {
    cert: string,
    key: string
  },
  enabled: true
}

const Domain: Schema = new Schema({
  account: Object,
  domain: String,
  port: Number,
  x509: { cert: String, key: String },
  enabled: Boolean,
});

export default model<DomainInterface>('Domain', Domain);
