/* eslint-disable consistent-return */
import { Message } from 'eris';
import { Client } from '..';
import { Command, RichEmbed } from '../class';

export default class Notify extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'notify';
    this.description = 'Sends a notification to a user.';
    this.usage = `${this.client.config.prefix}notify [username | user ID]`;
    this.permissions = { roles: ['446104438969466890'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args.length) return this.client.commands.get('help').run(message, [this.name]);
      const edit = await message.channel.createMessage(`***${this.client.stores.emojis.loading} Sending notification...***`);
      const account = await this.client.db.Account.findOne({ $or: [{ username: args[0] }, { userID: args[0].replace(/[<@!>]/gi, '') }] });
      if (!account) return edit.edit(`***${this.client.stores.emojis.error} Cannot find user.***`);
      const embed = new RichEmbed()
        .setTitle('Cloud Account | Notification')
        .setDescription(args.slice(1).join(' '))
        .addField('Moderator', `<@${message.author.id}>`, true)
        .setFooter(this.client.user.username, this.client.user.avatarURL)
        .setTimestamp();
      this.client.getDMChannel(account.userID).then((channel) => {
        // @ts-ignore
        channel.createMessage({ embed });
      });
      // @ts-ignore
      this.client.createMessage('580950455581147146', { embed });
      this.client.util.transport.sendMail({
        to: account.emailAddress,
        from: 'Library of Code sp-us | Cloud Services <support@libraryofcode.org>',
        subject: 'Notification',
        html: `
        <h1>Library of Code sp-us | Cloud Services</h1>
        <p>${args.slice(1).join(' ')}</p>
        <p><strong>Moderator:</strong> ${message.author.username}</p>

        <b><i>Library of Code sp-us | Support Team</i></b>
        `,
      });
      edit.edit(`***${this.client.stores.emojis.success} Send notification to ${account.username}.***`);
    } catch (error) {
      await this.client.util.handleError(error, message, this);
    }
  }
}
