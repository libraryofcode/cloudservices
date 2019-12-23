import { Document, Schema, model } from 'mongoose';

export interface AccountInterface extends Document {
  username: string,
  userID: string,
  homepath: string
  emailAddress: string,
  createdBy: string,
  createdAt: Date,
  locked: boolean,
  permissions: {
    support: boolean,
    staff: boolean,
    supervisor: boolean,
    communityManager: boolean,
    engineer: boolean
  },
  root: boolean,
  hash: boolean,
  salt: string,
  authTag: Buffer
}

const Account: Schema = new Schema({
  username: String,
  userID: String,
  homepath: String,
  emailAddress: String,
  createdBy: String,
  createdAt: Date,
  locked: Boolean,
  permissions: {
    support: Boolean,
    staff: Boolean,
    supervisor: Boolean,
    communityManager: Boolean,
    engineer: Boolean,
  },
  root: Boolean,
  hash: Boolean,
  salt: String,
  authTag: Buffer,
});

export default model<AccountInterface>('Account', Account);
