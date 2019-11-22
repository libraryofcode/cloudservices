import { Message } from 'eris';
import { Client } from '..';
import { Command } from '../class';

export default class Unlock extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'unlock';
    this.description = 'Unlocks an account.';
    this.permissions = { roles: ['455972169449734144', '643619219988152321'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) { // eslint-disable-line
    try {
      if (!args.length) return this.client.commands.get('help').run(message, [this.name]);
      const account = await this.client.db.Account.findOne({ $or: [{ username: args[0] }, { userID: args[0].replace(/[<@!>]/gi, '') }] });
      if (!account) return message.channel.createMessage(`***${this.client.stores.emojis.error} Cannot find user.***`);
      if (!account.locked) return message.channel.createMessage(`***${this.client.stores.emojis.error} This account is already unlocked.***`);
      const edit = await message.channel.createMessage(`***${this.client.stores.emojis.loading} Unlocking account...***`);
      if (account.username === 'matthew' || account.root) return edit.edit(`***${this.client.stores.emojis.error} Permission denied.***`);
      await this.client.util.exec(`unlock ${account.username}`);
      await account.updateOne({ locked: false });

      await this.client.util.createModerationLog(account.userID, message.member, 3, args.slice(1).join(' '));
      edit.edit(`***${this.client.stores.emojis.success} Account ${account.username} has been unlocked by Moderator ${message.author.username}#${message.author.discriminator}.***`);
    } catch (error) {
      await this.client.util.handleError(error, message, this);
    }
  }
}
