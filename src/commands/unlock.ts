import uuid from 'uuid/v4';
import { Message } from 'eris';
import { Client } from '..';
import { Command, RichEmbed } from '../class';

export default class Unlock extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'unlock';
    this.description = 'Unlocks an account.';
    this.permissions = { roles: ['608095934399643649', '521312697896271873'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) { // eslint-disable-line
    try {
      if (!args.length) return this.client.commands.get('help').run(message, [this.name]);
      const account = await this.client.db.Account.findOne({ $or: [{ account: args[0] }, { userID: args[0].replace(/[<@!>]/gi, '') }] });
      if (!account) return message.channel.createMessage(`***${this.client.stores.emojis.error} Cannot find user.***`);
      if (!account.locked) return message.channel.createMessage(`***${this.client.stores.emojis.error} This account is already unlocked.***`);
      const edit = await message.channel.createMessage(`***${this.client.stores.emojis.loading} Unlocking account...***`);
      if (account.username === 'matthew' || account.root) return edit.edit(`***${this.client.stores.emojis.error} Permission denied.***`);
      await this.client.util.exec(`unlock ${account.username}`);

      const moderation = new this.client.db.Moderation({
        username: account.username,
        userID: account.userID,
        logID: uuid(),
        moderatorID: message.author.id,
        reason: args.slice(1).join(' '),
        type: 3,
        date: new Date(),
      });
      await moderation.save();
      edit.edit(`***${this.client.stores.emojis.success} Account ${account.username} has been unlocked by Supervisor ${message.author.username}#${message.author.discriminator}.***`);
      const embed = new RichEmbed();
      embed.setTitle('Account Infraction | UnLock');
      embed.setColor(15158332);
      embed.addField('User', `${account.username} | <@${account.userID}>`, true);
      embed.addField('Supervisor', `<@${message.author.id}>`, true);
      if (args.slice(1).join(' ').length > 0) embed.addField('Reason', args.slice(1).join(' '), true);
      embed.setFooter(this.client.user.username, this.client.user.avatarURL);
      embed.setTimestamp();
      this.client.getDMChannel(account.userID).then((user) => {
        // @ts-ignore
        user.createMessage({ embed }).catch();
      });
      // @ts-ignore
      this.client.createMessage('580950455581147146', { embed });
    } catch (error) {
      await this.client.util.handleError(error, message, this);
    }
  }
}
