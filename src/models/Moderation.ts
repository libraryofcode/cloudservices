import { Document, Schema, model } from 'mongoose';

export interface ModerationInterface extends Document {
  account: string,
  userID: string,
  logID: string,
  moderatorID: string,
  reason: string,
  type: string,
  date: string
}

const Moderation: Schema = new Schema({
  account: String,
  userID: String,
  logID: Number,
  moderatorID: String,
  reason: String,
  type: String,
  date: Date,
});

export default model<ModerationInterface>('Moderation', Moderation);
