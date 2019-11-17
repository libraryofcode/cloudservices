import { Message, PrivateChannel } from 'eris';
import { Client } from '..';
import { Command, RichEmbed } from '../class';
import { AccountInterface } from '../models';

export default class SecureSign_Account extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'account';
    this.description = 'Provides SecureSign account details for currently logged in user';
    this.usage = `${this.client.config.prefix}securesign account`;
    this.enabled = true;
    this.guildOnly = false;
  }

  public async run(message: Message, args: string[]) {
    try {
      const user = await this.client.db.Account.findOne({ userID: message.author.id });
      if (!user || (user.permissions.staff && !(message.channel instanceof PrivateChannel))) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Run this command in your DMs!***`);

      let account: AccountInterface;
      if (!args[0] || !user.permissions.staff) account = user;
      else account = await this.client.db.Account.findOne({ $or: [{ userID: args[0] }, { username: args[0] }, { emailAddress: args[0] }] });

      if (!account) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not found***`);
      if (!account.hash) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not initialized***`);
      const msg = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Loading account details...***`);

      const details = await this.client.util.exec(`sudo -H -u ${account.username} bash -c 'securesign-canary account'`);
      const info = details.replace(/^\s+|\s+$/g, '').replace(/\n/g, '\n**').replace(/: /g, ':** ').split('\n');
      const title = info.shift();
      const description = info.join('\n');
      const content = '';

      const embed = new RichEmbed();
      embed.setTitle(title);
      embed.setDescription(description);
      embed.setAuthor(this.client.user.username, this.client.user.avatarURL);
      embed.setFooter(`Requested by ${message.member.username}#${message.member.discriminator}`, message.member.avatarURL);

      // @ts-ignore
      return msg.edit({ content, embed });
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
