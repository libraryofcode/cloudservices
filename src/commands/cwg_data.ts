import fs from 'fs-extra';
import moment from 'moment';
import x509 from '@ghaiklor/x509';
import { createPaginationEmbed } from 'eris-pagination';
import { Message } from 'eris';
import { Command, RichEmbed } from '../class';
import { Client } from '..';

export default class CWG_Data extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'data';
    this.description = 'Check CWG data';
    this.usage = `${this.client.config.prefix}cwg data [Domain | Port]`;
    this.permissions = { roles: ['446104438969466890'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args[0]) return this.client.commands.get('help').run(message, ['cwg', this.name]);
      const dom = await this.client.db.Domain.find({ $or: [{ domain: args[0] }, { port: Number(args[0]) || '' }] });
      if (!dom.length) return message.channel.createMessage(`***${this.client.stores.emojis.error} The domain or port you provided could not be found.***`);
      // const embeds: RichEmbed[] = [];
      const embeds = await dom.map(async (domain) => {
        const cert = await fs.readFile(domain.x509.cert, { encoding: 'utf8' });
        const embed = new RichEmbed();
        embed.setTitle('Domain Information');
        embed.addField('Account Username', domain.account.username, true);
        embed.addField('Account ID', domain.account.userID, true);
        embed.addField('Domain', domain.domain, true);
        embed.addField('Port', String(domain.port), true);
        embed.addField('Certificate Issuer', x509.getIssuer(cert).organizationName, true);
        embed.addField('Certificate Subject', x509.getSubject(cert).commonName, true);
        embed.addField('Certificate Expiration Date', moment(x509.parseCert(cert).notAfter).format('dddd, MMMM Do YYYY, h:mm:ss A'), true);
        embed.setFooter(this.client.user.username, this.client.user.avatarURL);
        embed.setTimestamp();
        return embed; // s.push(embed);
      });
      this.client.signale.log(embeds);
      // @ts-ignore
      if (embeds.length === 1) return message.channel.createMessage({ embed: embeds[0] });
      return createPaginationEmbed(message, this.client, embeds, {});
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
