import { parseCert } from '@ghaiklor/x509';
import { Message } from 'eris';
import { readdirSync } from 'fs';
import moment from 'moment';
import { Client } from '..';
import { Command, RichEmbed } from '../class';

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
      const search = await this.client.db.Account.find();
      const accounts = search.map((acc) => acc.username);
      const initial = accounts.map((acc) => `${this.client.stores.emojis.loading} **${acc}** Loading...`);
      embed.setDescription(initial.join('\n'));
      // @ts-ignore
      const msg = await message.channel.createMessage({ embed });

      accounts.forEach(async (a) => {
        try {
          const certFile = readdirSync(`/home/${a}/Validation`)[0];
          const { notAfter } = parseCert(`/home/${a}/Validation/${certFile}`);
          // @ts-ignore
          const time = moment.preciseDiff(new Date(), notAfter);

          if (notAfter < new Date()) initial[accounts.findIndex((acc) => acc === a)] = `${this.client.stores.emojis.error} **${a}** Certificate expired ${time} ago`;
          else initial[accounts.findIndex((acc) => acc === a)] = `${this.client.stores.emojis.success} **${a}** Certificate expires in ${time}`;

          embed.setDescription(initial.join('\n'));
          await msg.edit({ embed });
        } catch (error) {
          if (error.message.includes('no such file or directory') || error.message.includes('File doesn\'t exist.')) {
            initial[accounts.findIndex((acc) => acc === a)] = `${this.client.stores.emojis.error} **${a}** Unable to locate certificate`;
            embed.setDescription(initial.join('\n'));
            await msg.edit({ embed });
          } else throw error;
        }
      });
    } catch (error) {
      this.client.util.handleError(error, message, this);
    }
  }
}
