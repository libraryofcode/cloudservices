import { promisify } from 'util';
import childProcess from 'child_process';
import nodemailer from 'nodemailer';
import Command from './class/Command'
import Client from './Client'

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

  public resolveCommand(client: Client, command: string): Command {
    if (client.commands.has(command)) return client.commands.get(command)
    for (const cmd of client.commands.values()) {
      if (!cmd.aliases) continue
      for (const alias of cmd.aliases) {
        if (command === alias.toLowerCase()) return cmd
      }
    }
  }
}