import { Message, PrivateChannel } from 'eris';
import uuid from 'uuid/v4';
import { Command, RichEmbed } from '../class';
import { Client, config } from '..';

export default class DeleteAccount extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'deleteaccount';
    this.description = 'Delete an account on the Cloud VM';
    this.usage = `${config.prefix}deleteaccount [User ID] [Reason] | ${config.prefix}deleteaccount [Username] [Reason] | ${config.prefix}deleteaccount [Email] [Reason]`;
    this.aliases = ['deleteacc', 'dacc', 'daccount', 'delete'];
    this.permissions = { roles: ['475817826251440128', '525441307037007902'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args[1]) return this.client.commands.get('help').run(message, [this.name]);
      const account = await this.client.db.Account.findOne({ $or: [{ username: args[0] }, { userID: args[0] }, { emailAddress: args[0] }] });
      if (!account) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not found***`);
      const { root, username, userID, emailAddress } = account;
      if (root) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Permission denied***`);

      const pad = (number: number, amount: number): string => '0'.repeat(amount - number.toString().length) + number;
      const randomNumber = Math.floor(Math.random() * 9999);
      const verify = pad(randomNumber, 4);
      try {
        await this.client.util.messageCollector(message,
          `***Please confirm that you are permanently deleting ${username}'s account by entering ${verify}. This action cannot be reversed.***`,
          15000, true, [verify], (msg) => !(message.channel instanceof PrivateChannel && msg.author.id === message.author.id));
      } catch (error) {
        if (error.message.includes('Did not supply')) return message;
        throw error;
      }

      const deleting = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Deleteing account, please wait...***`);
      await this.client.util.deleteAccount(username);
      const reason = args.slice(1).join(' ');
      const logInput = { username, userID, logID: uuid(), moderatorID: message.author.id, type: 4, date: new Date(), reason: null };
      if (reason) logInput.reason = reason;
      const log = await new this.client.db.Moderation(logInput);
      await log.save();

      const embed = new RichEmbed();
      embed.setTitle('Cloud Account | Delete');
      embed.setColor('ff0000');
      embed.addField('User', `${username} | <@${userID}>`);
      embed.addField('Engineer', `<@${message.author.id}>`, true);
      if (reason) embed.addField('Reason', reason);
      embed.setFooter(this.client.user.username, this.client.user.avatarURL);
      embed.setTimestamp();
      // @ts-ignore
      this.client.createMessage('580950455581147146', { embed });
      this.client.getDMChannel(userID).then((user) => {
        // @ts-ignore
        user.createMessage({ embed }).catch();
      });

      this.client.util.transport.sendMail({
        to: account.emailAddress,
        from: 'Library of Code sp-us | Cloud Services <support@libraryofcode.org>',
        subject: 'Your account has been deleted',
        html: `
        <h1>Library of Code | Cloud Services</h1>
        <p>Your Cloud Account has been deleted by our Engineers. There is no way to recover your files and this desicion cannot be appealed. We're sorry to see you go.</p>
        <p><b>Reason:</b> ${reason}</p>
        <p><b>Engineer:</b> ${message.author.username}</p>
        
        <b><i>Library of Code sp-us | Support Team</i></b>
        `,
      });

      return deleting.edit(`${this.client.stores.emojis.success} ***Account ${username} has been deleted by Engineer ${message.author.username}#${message.author.discriminator}***`);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
