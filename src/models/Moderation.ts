import { Document, Schema, model } from 'mongoose';
import { ModerationInterface } from '.';

export interface ModerationInterface extends Document {
  username: string,
  userID: string,
  logID: string,
  moderatorID: string,
  reason: string,
  /**
   * @field 0 - Create
   * @field 1 - Warn
   * @field 2 - Lock
   * @field 3 - Unlock
   * @field 4 - Delete
   */
  type: 0 | 1 | 2 | 3 | 4
  date: Date,
  expiration: {
    date: Date,
    processed: boolean
  }
}

const Moderation: Schema = new Schema({
  username: String,
  userID: String,
  logID: String,
  moderatorID: String,
  reason: String,
  type: Number,
  date: Date,
  expiration: {
    date: Date,
    processed: Boolean,
  },
});

export default model<ModerationInterface>('Moderation', Moderation);
