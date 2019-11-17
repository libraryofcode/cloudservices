import express from 'express';
import { AccountInterface } from '../models';

export interface Req extends express.Request {
  account: AccountInterface
}
