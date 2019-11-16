import { Document, Schema, model } from 'mongoose';

export interface AccountInterface extends Document {
  username: string,
  userID: string,
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
  root: boolean
  ssInit: boolean
}

const Account: Schema = new Schema({
  username: String,
  userID: String,
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
  ssInit: Boolean,
});

export default model<AccountInterface>('Account', Account);
