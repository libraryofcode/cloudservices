import { promisify } from 'util';
import childProcess from 'child_process';
import nodemailer from 'nodemailer';
import Client from './Client';
import Command from './class/Command';

export default class Util {
  public client: Client;

  constructor(client: Client) {
    this.client = client;
  }

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

  public sendError(error: Error): void {
    // @ts-ignore
    this.client.guilds.get('446067825673633794').channels.get('595788220764127272').createMessage(`\`\`\`ts\n${error.stack}\`\`\``);
  }

  public resolveCommand(command: string): Command {
    if (this.client.commands.has(command)) return this.client.commands.get(command);
    for (const cmd of this.client.commands.values()) {
      if (!cmd.aliases) continue;
      for (const alias of cmd.aliases) {
        if (command === alias.toLowerCase()) return cmd;
      }
    }
  }
}
