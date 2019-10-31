/* eslint-disable consistent-return */
import { Message } from 'eris';
import { Client } from '..';
import { Command } from '../class';

export default class Warn extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'warn';
    this.description = 'Sends an official warning to user.';
    this.usage = `${this.client.config.prefix}warn [username | user ID]`;
    this.permissions = { roles: ['446104438969466890'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args.length) return this.client.commands.get('help').run(message, [this.name]);
      const edit = await message.channel.createMessage(`***${this.client.stores.emojis.loading} Sending warning...***`);
      const account = await this.client.db.Account.findOne({ $or: [{ username: args[0] }, { userID: args[0].replace(/[<@!>]/gi, '') }] });
      if (!account) return edit.edit(`***${this.client.stores.emojis.error} Cannot find user.***`);
      if (account.root) return edit.edit(`***${this.client.stores.emojis.error} Permission denied.***`);
      await this.client.util.createModerationLog(account.userID, message.member, 1, args.slice(1).join(' '));
      edit.edit(`***${this.client.stores.emojis.success} Account ${account.username} has been warned by Moderator ${message.author.username}#${message.author.discriminator}.***`);
      this.client.util.transport.sendMail({
        to: account.emailAddress,
        from: 'Library of Code sp-us | Cloud Services <support@libraryofcode.org>',
        subject: 'Your account has been warned',
        html: `
        <h1>Library of Code sp-us | Cloud Services</h1>
        <p>Your account has received an official warning from a Moderator. Please get the underlying issue resolved to avoid <i>possible</i> moderative action.</p>
        <p><strong>Reason:</strong> ${args.slice(1).join(' ') ? args.slice(1).join(' ') : 'Not Specified'}</p>
        <p><strong>Moderator:</strong> ${message.author.username}</p>

        <b><i>Library of Code sp-us | Support Team</i></b>
        `,
      });
    } catch (error) {
      await this.client.util.handleError(error, message, this);
    }
  }
}
