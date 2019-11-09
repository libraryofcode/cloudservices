import { Message } from 'eris';
import moment from 'moment';
import { Client } from '..';
import { RichEmbed, Command } from '../class';
import { dataConversion } from '../functions';
// eslint-disable-next-line import/no-unresolved
import 'moment-precise-range-plugin';

export default class Disk extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'disk';
    this.description = 'Checks the used disk space by a user';
    this.usage = `${this.client.config.prefix}disk [Username/User ID/Email]`;
    this.permissions = { roles: ['446104438969466890'] };
    this.enabled = true;
  }

  async run(message: Message, args: string[]) {
    try {
      const account = await this.client.db.Account.findOne({ $or: [{ username: args[0] }, { userID: args[0] }, { emailAddress: args[0] }] });
      if (!account) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not found***`);
      if (account.root || args[0].includes('./')) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Permission denied***`);
      const diskReply = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Fetching total disk size may up to 10 minutes. This message will edit when the disk size has been located.***`);
      const start = Date.now();
      const result = await this.client.util.exec(`du -s /home/${account.username}`);
      const end = Date.now();
      // @ts-ignore
      const totalTime: string = moment.preciseDiff(start, end);
      const embed = new RichEmbed();
      embed.setTitle('Disk Usage');
      embed.setColor('ff0000');
      embed.setDescription(`/home/${account.username}`);
      embed.addField('Result', dataConversion(Number(result)), true);
      embed.addField('Time taken', totalTime, true);
      embed.setFooter(`Requested by ${message.author.username}#${message.author.discriminator}`, message.author.avatarURL);
      embed.setTimestamp();
      // @ts-ignore
      return diskReply.edit({ content: '', embed });
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
