import { promisify } from 'util';
import childProcess from 'child_process';
import nodemailer from 'nodemailer';
import { Message } from 'eris';
import { Client } from '.';
import { Command } from './class';

export default class Util {
  public client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async exec(command: string): Promise<string> {
    const ex = promisify(childProcess.exec);
    let result: string;
    // eslint-disable-next-line no-useless-catch
    try {
      const res = await ex(command);
      result = res.stderr || res.stdout;
    } catch (err) {
      throw err;
    }
    return result;
  }

  public resolveCommand(command: string): Command {
    if (this.client.commands.has(command)) return this.client.commands.get(command);
    for (const cmd of this.client.commands.values()) {
      if (!cmd.aliases) continue;// eslint-disable-line no-continue
      for (const alias of cmd.aliases) {
        if (command === alias.toLowerCase()) return cmd;
      }
    }
    return undefined;
  }

  public async handleError(error: Error, message?: Message, command?: Command): Promise<Message> {
    const stack = await this.client.createMessage('595788220764127272', `\`\`\`js\n${error.stack}\n\`\`\``);
    if (command) this.client.commands.get(command.name).enabled = false;
    if (message) message.channel.createMessage(`***${this.client.stores.emojis.error} An unexpected error has occured - please contact a member of the Engineering Team.${command ? ' This command has been disabled.' : ''}***`);
    return stack;
  }

  public splitFields(fields: {name: string, value: string, inline?: boolean}[]): {name: string, value: string, inline?: boolean}[][] {
    let index = 0;
    const array: {name: string, value: string, inline?: boolean}[][] = [[]];
    while (fields.length) {
      if (array[index].length >= 25) { index += 1; array[index] = []; }
      array[index].push(fields[0]); fields.shift();
    }
    return array;
  }
}
