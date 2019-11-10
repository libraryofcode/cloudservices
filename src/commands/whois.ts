/* eslint-disable consistent-return */
import moment from 'moment';
import { Message } from 'eris';
import { Client } from '..';
import { Command, RichEmbed } from '../class';
import { dataConversion } from '../functions';

export default class Whois extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'whois';
    this.description = 'Views information for a cloud account.';
    this.aliases = ['account', 'user'];
    this.usage = `${this.client.config.prefix}account [User Name | User ID | Email Address]`;
    this.permissions = { roles: ['446104438969466890'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args[0]) return this.client.commands.get('help').run(message, [this.name]);
      const account = await this.client.db.Account.findOne({ $or: [{ username: args[0] }, { userID: args[0] }, { emailAddress: args[0] }] });
      if (!account) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not found.***`);
      const embed = new RichEmbed();
      embed.setTitle('Account Information');
      if (this.client.users.get(account.userID)) embed.setThumbnail(this.client.users.get(account.userID).avatarURL);
      embed.setColor(0x36393f);
      embed.setDescription(`${await this.client.util.exec(`finger ${account.username}`)}\n${await this.client.util.exec(`chage -l ${account.username}`)}`);
      embed.addField('Username', `${account.username} | <@${account.userID}>`, true);
      embed.addField('ID', account.userID, true);
      embed.addField('Email Address', account.emailAddress, true);
      embed.addField('Created By', `<@${this.client.users.get(account.createdBy).id}>`, true);
      embed.addField('Created At', moment(account.createdAt).format('dddd, MMMM Do YYYY, h:mm:ss A'), true);
      const cpuUsage = await this.client.util.exec(`top -b -n 1 -u ${account.username} | awk 'NR>7 { sum += $9; } END { print sum; }'`);
      embed.addField('CPU Usage', cpuUsage.split('\n')[0] ? `${cpuUsage.split('\n')[0]}%` : '0%', true);
      embed.addField('Memory', dataConversion(Number(await this.client.util.exec(`memory ${account.username}`)) * 1000), true);
      const data = await this.client.redis.get(`storage-${account.username}`) ? dataConversion(Number(await this.client.redis.get(`storage-${account.username}`))) : 'N/A';
      embed.addField('Storage', data, true);
      let details = '';
      if (account.locked) details += 'This account is currently locked.\n';
      if (account.permissions.engineer) details += 'This account belongs to an Engineer.\n';
      else if (account.permissions.communityManager) details += 'This account belongs to a Community Manager.\n';
      else if (account.permissions.supervisor) details += 'This account belongs to a Supervisor.\n';
      else if (account.permissions.staff) details += 'This account belongs to a Staff member.\n';
      else if (account.permissions.support) details += 'This account belongs to a Support member.\n';
      if (account.root) details += 'This account has root/administrative privileges.\n';
      if (details) embed.addField('Additional Details', details, true);
      embed.setFooter(this.client.user.username, this.client.user.avatarURL);
      embed.setTimestamp();
      // @ts-ignore
      message.channel.createMessage({ embed });
    } catch (error) {
      await this.client.util.handleError(error, message, this);
    }
  }
}
