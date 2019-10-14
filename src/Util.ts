import { promisify } from 'util';
import childProcess from 'child_process';
import nodemailer from 'nodemailer';

export default class Util {
  constructor() {}

  public async exec(command: string): Promise<string> {
    const ex = promisify(childProcess.exec);
    let result: string;
    try {
      const res = await ex(command);
      if (res.stderr) result = res.stderr;
      else result = res.stdout;
    } catch (err) {
      throw err;
    }
    return result;
  }
}