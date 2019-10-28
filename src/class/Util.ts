/* eslint-disable no-param-reassign */
import { promisify, isArray } from 'util';
import childProcess from 'child_process';
import nodemailer from 'nodemailer';
import { Message, PrivateChannel } from 'eris';
import { outputFile } from 'fs-extra';
import { Client } from '..';
import { Command, RichEmbed } from '.';

export default class Util {
  public client: Client;

  public transport: nodemailer.Transporter;

  constructor(client: Client) {
    this.client = client;
    this.transport = nodemailer.createTransport({
      host: 'staff.libraryofcode.org',
      auth: { user: 'support', pass: this.client.config.emailPass },
    });
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

  public async handleError(error: Error, message?: Message, command?: Command): Promise<void> {
    this.client.signale.error(error);
    /*
    const info = { content: `\`\`\`js\n${error.stack}\n\`\`\``, embed: null };
    if (message) {
      const embed = new RichEmbed();
      embed.setColor('FF0000');
      embed.setAuthor(`Error caused by ${message.author.username}#${message.author.discriminator}`, message.author.avatarURL);
      embed.setTitle('Message content');
      embed.setDescription(message.content);
      embed.addField('User', `${message.author.mention} (\`${message.author.id}\`)`, true);
      embed.addField('Channel', message.channel.mention, true);
      let guild: string;
      if (message.channel instanceof PrivateChannel) guild = '@me';
      else guild = message.channel.guild.id;
      embed.addField('Message link', `[Click here](https://discordapp.com/channels/${guild}/${message.channel.id}/${message.id})`, true);
      embed.setTimestamp(new Date(message.timestamp));
      info.embed = embed;
    }
    await this.client.createMessage('595788220764127272', info);
    if (message) this.client.createMessage('595788220764127272', 'Message content for above error');
    if (command) this.client.commands.get(command.name).enabled = false;
    if (message) message.channel.createMessage(`***${this.client.stores.emojis.error} An unexpected error has occured - please contact a member of the Engineering Team.${command ? ' This command has been disabled.' : ''}***`);
    */
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

  public splitString(string: string, length: number): string[] {
    if (!string) return [];
    if (Array.isArray(string)) string = string.join('\n');
    if (string.length <= length) return [string];
    const arrayString: string[] = [];
    let str: string = '';
    let pos: number;
    while (string.length > 0) {
      pos = string.length > length ? string.lastIndexOf('\n', length) : outputFile.length;
      if (pos > length) pos = length;
      str = string.substr(0, pos);
      string = string.substr(pos);
      arrayString.push(str);
    }
    return arrayString;
  }
}
