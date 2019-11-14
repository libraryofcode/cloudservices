import moment from 'moment';
import { Message } from 'eris';
import { Client } from '..';
import { Command, RichEmbed } from '../class';

export default class Lock extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'lock';
    this.description = 'Locks an account.';
    this.permissions = { roles: ['455972169449734144', '643619219988152321'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) { // eslint-disable-line
    try {
      if (!args.length) return this.client.commands.get('help').run(message, [this.name]);
      const account = await this.client.db.Account.findOne({ $or: [{ username: args[0] }, { userID: args[0].replace(/[<@!>]/gi, '') }] });
      if (!account) return message.channel.createMessage(`***${this.client.stores.emojis.error} Cannot find user.***`);
      if (account.locked) return message.channel.createMessage(`***${this.client.stores.emojis.error} This account is already locked.***`);
      const edit = await message.channel.createMessage(`***${this.client.stores.emojis.loading} Locking account...***`);
      if (account.username === 'matthew' || account.root) return edit.edit(`***${this.client.stores.emojis.error} Permission denied.***`);
      await this.client.util.exec(`lock ${account.username}`);
      await account.updateOne({ locked: true });

      const expiry = new Date();
      const lockLength = args[1].match(/[a-z]+|[^a-z]+/gi);
      // @ts-ignore
      const momentMilliseconds = moment.duration(Number(lockLength[0]), lockLength[1]).asMilliseconds();
      /*
      expiry.setMilliseconds(momentMilliseconds);
      let processed: boolean = false;
      if (!momentMilliseconds) processed = true;
      */

      this.client.signale.debug(lockLength);
      this.client.signale.debug(expiry);
      this.client.signale.debug(momentMilliseconds);
      const reason = momentMilliseconds ? args.slice(2).join(' ') : args.slice(1).join(' ');

      await this.client.util.createModerationLog(account.userID, message.member, 2, reason, momentMilliseconds);
      edit.edit(`***${this.client.stores.emojis.success} Account ${account.username} has been locked by Supervisor ${message.author.username}#${message.author.discriminator}.***`);

      this.client.util.transport.sendMail({
        to: account.emailAddress,
        from: 'Library of Code sp-us | Cloud Services <support@libraryofcode.org>',
        subject: 'Your account has been locked',
        html: `
        <h1>Library of Code | Cloud Services</h1>
        <p>Your Cloud Account has been locked until ${momentMilliseconds ? moment(expiry).calendar() : 'indefinitely'} under the EULA.</p>
        <p><b>Reason:</b> ${momentMilliseconds ? args.slice(2).join(' ') : args.slice(1).join(' ')}</p>
        <p><b>Supervisor:</b> ${message.author.username}</p>
        <p><b>Expiration:</b> ${momentMilliseconds ? moment(expiry).format('dddd, MMMM Do YYYY, h:mm:ss A') : 'N/A'}</p>
        
        <b><i>Library of Code sp-us | Support Team</i></b>
        `,
      });
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
