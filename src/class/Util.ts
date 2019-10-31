/* eslint-disable no-param-reassign */
import { promisify } from 'util';
import childProcess from 'child_process';
import nodemailer from 'nodemailer';
import { Message, PrivateChannel, Member, User } from 'eris';
import { outputFile } from 'fs-extra';
import uuid from 'uuid/v4';
import moment from 'moment';
import { Client } from '..';
import { Command, RichEmbed } from '.';
import { ModerationInterface, AccountInterface } from '../models';

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
      return Promise.reject(new Error(`Command failed: ${err.cmd}\n${err.stderr || err.stdout}`));
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
    try {
      this.client.signale.error(error);
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
      if (command) this.client.commands.get(command.name).enabled = false;
      if (message) message.channel.createMessage(`***${this.client.stores.emojis.error} An unexpected error has occured - please contact a member of the Engineering Team.${command ? ' This command has been disabled.' : ''}***`);
    } catch (err) {
      this.client.signale.error(err);
    }
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
      pos = string.length > length ? string.lastIndexOf('\n', length) : string.length;
      if (pos > length) pos = length;
      str = string.substr(0, pos);
      string = string.substr(pos);
      arrayString.push(str);
    }
    return arrayString;
  }


  public async createHash(password: string) {
    const hashed = await this.exec(`mkpasswd -m sha-512 "${password}"`);
    return hashed;
  }

  public isValidEmail(email: string): boolean {
    const checkAt = email.indexOf('@');
    if (checkAt < 1) return false;
    const checkDomain = email.indexOf('.', checkAt + 2);
    if (checkDomain < checkAt) return false;
    return true;
  }

  public randomPassword(): string {
    let tempPass = ''; const passChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    while (tempPass.length < 5) { tempPass += passChars[Math.floor(Math.random() * passChars.length)]; }
    return tempPass;
  }

  public async createAccount(hash: string, etcPasswd: string, username: string, userID: string, emailAddress: string, moderatorID: string): Promise<AccountInterface> {
    await this.exec(`useradd -m -p ${hash} -c ${etcPasswd} -s /bin/bash ${username}`);
    await this.exec(`chage -d0 ${username}`);

    const account = await new this.client.db.Account({
      username, userID, emailAddress, createdBy: moderatorID, createdAt: new Date(), locked: false,
    });
    return account.save();
  }

  public async deleteAccount(username: string): Promise<void> {
    await this.exec(`deluser ${username} --remove-home --backup-to /management/Archives && rm -rf -R /home/${username}`);
    await this.client.db.Account.deleteOne({ username });
  }

  public async messageCollector(message: Message, question: string, timeout: number, shouldDelete = false, choices: string[] = null, filter = (msg: Message): boolean|void => {}): Promise<Message> {
    const msg = await message.channel.createMessage(question);
    return new Promise((res, rej) => {
      setTimeout(() => { if (shouldDelete) msg.delete(); rej(new Error('Did not supply a valid input in time')); }, timeout);
      this.client.on('messageCreate', (Msg) => {
        if (filter(Msg) === false) return;
        const verif = choices ? choices.includes(Msg.content) : Msg.content;
        if (verif) { if (shouldDelete) msg.delete(); res(Msg); }
      });
    });
  }

  /**
   * @param type `0` - Create
   * `1` - Warn
   * `2` - Lock
   * `3` - Unlock
   * `4` - Delete
   */
  public async createModerationLog(user: string, moderator: Member|User, type: number, reason?: string, duration?: number): Promise<ModerationInterface> {
    const moderatorID = moderator.id;
    const account = await this.client.db.Account.findOne({ $or: [{ username: user }, { userID: user }] });
    if (!account) return Promise.reject(new Error(`Account ${user} not found`));
    const { username, userID } = account;
    const logInput: { username: string, userID: string, logID: string, moderatorID: string, reason?: string, type: number, date: Date, expiration?: { date: Date, processed: boolean }} = {
      username, userID, logID: uuid(), moderatorID, type, date: new Date(),
    };

    const now: number = Date.now();
    let date: Date;
    let processed = true;
    if (reason) logInput.reason = reason;
    if (type === 2) {
      if (duration) {
        date = new Date(now + duration);
        processed = false;
      } else date = null;
    }

    const expiration = { date, processed };

    logInput.expiration = expiration;
    const log = await new this.client.db.Moderation(logInput);
    await log.save();

    let embedTitle: string;
    let color: string;
    let archType: string;
    switch (type) {
      default: archType = 'Moderator'; embedTitle = 'Cloud Account | Generic'; color = '0892e1'; break;
      case 0: archType = 'Administrator'; embedTitle = 'Cloud Account | Create'; color = '00ff00'; break;
      case 1: archType = 'Moderator'; embedTitle = 'Account Warning | Warn'; color = 'ffff00'; break;
      case 2: archType = 'Supervisor'; embedTitle = 'Account Infraction | Lock'; color = 'ff6600'; break;
      case 3: archType = 'Supervisor'; embedTitle = 'Account Reclaim | Unlock'; color = '0099ff'; break;
      case 4: archType = 'Administrator'; embedTitle = 'Cloud Account | Delete'; color = 'ff0000'; break;
    }
    const embed = new RichEmbed()
      .setTitle(embedTitle)
      .setColor(color)
      .addField('User', `${username} | <@${userID}>`, true)
      .addField(archType, moderatorID === this.client.user.id ? 'SYSTEM' : `<@${moderatorID}>`, true)
      .setFooter(this.client.user.username, this.client.user.avatarURL)
      .setTimestamp();
    if (reason) embed.addField('Reason', reason || 'Not specified');
    if (type === 2) embed.addField('Lock Expiration', `${date ? moment(date).format('dddd, MMMM Do YYYY, h:mm:ss A') : 'Indefinitely'}`);
    // @ts-ignore
    this.client.createMessage('580950455581147146', { embed }); this.client.getDMChannel(userID).then((channel) => channel.createMessage({ embed })).catch();

    return Promise.resolve(log);
  }
}
