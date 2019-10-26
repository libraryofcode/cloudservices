import fs from 'fs-extra';
import uuid from 'uuid/v4';
import moment from 'moment';
import { Message } from 'eris';
import { Client } from '..';
import { Command, RichEmbed } from '../class';

export default class Lock extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'lock';
    this.description = 'Locks an account.';
    this.permissions = { roles: ['608095934399643649', '521312697896271873'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) { // eslint-disable-line
    try {
      const account = await this.client.db.Account.findOne({ $or: [{ account: args[0] }, { userID: args[0].replace(/[<@!>]/gi, '') }] });
      if (!account) return message.channel.createMessage(`***${this.client.stores.emojis.error} Cannot find user.***`);
      const edit = await message.channel.createMessage(`***${this.client.stores.emojis.loading} Locking account...***`);
      if (account.locked) return edit.edit(`***${this.client.stores.emojis.error} This account is already locked.***`);
      if (account.username === 'matthew') return edit.edit(`***${this.client.stores.emojis.error} Permission denied.***`);
      await this.client.util.exec(`lock ${account.username}`);

      const expiry = new Date();
      // @ts-ignore
      const momentMilliseconds = moment.duration(Number(args[1].split('')[0]), args[1].split('')[1]).asMilliseconds;
      expiry.setMilliseconds(momentMilliseconds);
      let processed: boolean;
      if (momentMilliseconds) {
        processed = false;
      } else {
        processed = true;
      }
      const moderation = new this.client.db.Moderation({
        username: account.username,
        userID: account.userID,
        logID: uuid(),
        moderatorID: message.author.id,
        reason: momentMilliseconds ? args.slice(2).join(' ') : args.slice(1).join(' '),
        type: 3,
        date: new Date(),
        expiration: {
          expirationDate: momentMilliseconds ? expiry : null,
          processed,
        },
      });
      await moderation.save();
      edit.edit(`***${this.client.stores.emojis.success} Account ${account.username} has been locked by Supervisor ${message.author.username}#${message.author.discriminator}.***`);
      const embed = new RichEmbed();
      embed.setTitle('Account Infraction | Lock');
      embed.setColor(15158332);
      embed.addField('User', `${account.username} | <@${account.userID}>`, true);
      embed.addField('Supervisor', `<@${message.author.id}>`, true);
      if ((momentMilliseconds ? args.slice(2).join(' ') : args.slice(1).join(' ')).length > 0) embed.addField('Reason', momentMilliseconds ? args.slice(2).join(' ') : args.slice(1).join(' '));
      embed.setFooter(this.client.user.username, this.client.user.avatarURL);
      embed.setTimestamp();
      // @ts-ignore
      this.client.getDMChannel(account.userID).then((user) => {
        // @ts-ignore
        user.createMessage({ embed });
      });
      // @ts-ignore
      this.client.createMessage('580950455581147146', { embed });

      this.client.util.transport.sendMail({
        to: account.emailAddress,
        from: 'Library of Code sp-us | Cloud Services <support@libraryofcode.org>',
        subject: 'Your account has been locked',
        html: `
        <h1>Library of Code | Cloud Services</h1>
        <p>Your Cloud Account has been locked until ${momentMilliseconds ? moment(expiry).calendar() : 'indefinitely'} under the EULA.</p>
        <p><strong>Reason:</strong> ${momentMilliseconds ? args.slice(2).join(' ') : args.slice(1).join(' ')}</p>
        <p><strong>Supervisor:</strong> ${message.author.username}</p>
        <p><strong>Expiration:</strong> ${momentMilliseconds ? moment(expiry).format('dddd, MMMM Do YYYY, h:mm:ss A') : 'N/A'}</p>
        
        <strong><i>Library of Code sp-us | Support Team</i></strong>
        `,
      });
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
