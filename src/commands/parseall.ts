import { parseCert } from '@ghaiklor/x509';
import { Message } from 'eris';
import { readdirSync } from 'fs';
import moment from 'moment';
import { Client } from '..';
import { Command, RichEmbed } from '../class';
import { parseCertificate } from '../functions';

export default class Parseall extends Command {
  constructor(client: Client) {
    super(client);

    this.name = 'parseall';
    this.description = 'Displays certificate validation for all accounts';
    this.usage = `${this.client.config.prefix}parseall`;
    this.permissions = { roles: ['446104438969466890'] };
    this.aliases = ['checkcerts', 'verifyall', 'verifycerts'];
  }

  public async run(message: Message, args: string[]) {
    try {
      const embed = new RichEmbed();
      embed.setTitle('Certificate Validation');
      embed.setAuthor(this.client.user.username, this.client.user.avatarURL);
      embed.setFooter(`Requested by ${message.member.username}#${message.member.discriminator}`, message.member.avatarURL);
      embed.setTimestamp();
      const search = await this.client.db.Account.find();
      const final: string[] = [];

      for (const a of search) {
        try {
          const certFile = readdirSync(`${a.homepath}/Validation`)[0];
          const { notAfter } = await parseCertificate(this.client, `${a.homepath}/Validation/${certFile}`); // eslint-disable-line
          // @ts-ignore
          const timeObject: {years: number, months: number, days: number, hours: number, minutes: number, seconds: number, firstDateWasLater: boolean} = moment.preciseDiff(new Date(), notAfter, true);
          const precise: [number, string][] = [];
          // @ts-ignore
          const timeArray: number[] = Object.values(timeObject).filter((v) => typeof v === 'number');
          timeArray.forEach((t) => { // eslint-disable-line
            const index = timeArray.indexOf(t);
            const measurements = ['yr', 'mo', 'd', 'h', 'm', 's'];
            precise.push([t, measurements[index]]);
          });
          const time = precise.filter((n) => n[0]).map(((v) => v.join(''))).join(', ');

          if (notAfter < new Date()) final.push(`${this.client.stores.emojis.error} **${a.username}** Expired ${time} ago`);
          else final.push(`${this.client.stores.emojis.success} **${a.username}** Expires in ${time}`);
        } catch (error) {
          if (error.message.includes('no such file or directory') || error.message.includes('File doesn\'t exist.')) final.push(`${this.client.stores.emojis.error} **${a.username}** Unable to locate certificate`);
          else if (error.message.includes('panic: Certificate PEM Encode == nil')) final.push(`${this.client.stores.emojis.error} ** ${a.username}** Invalid certificate`);
          else throw error;
        }
      }

      if (final.join('\n').length < 2048) embed.setDescription(final.join('\n'));
      else {
        const split = this.client.util.splitString(final.join('\n'), 1024);
        split.forEach((s) => embed.addField('\u200B', s));
      }

      // @ts-ignore
      return await message.channel.createMessage({ embed });
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
