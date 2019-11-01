import fs from 'fs-extra';
import axios from 'axios';
import { Message } from 'eris';
import { Command, RichEmbed } from '../class';
import { Client } from '..';

export default class CWG_Delete extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'delete';
    this.description = 'Unbind a domain to the CWG';
    this.usage = `${this.client.config.prefix}cwg delete [Domain | Port]`;
    this.permissions = { roles: ['525441307037007902'] };
    this.aliases = ['unbind'];
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args[0]) return this.client.commands.get('help').run(message, ['cwg', this.name]);
      const domain = await this.client.db.Domain.findOne({ $or: [{ domain: args[0] }, { port: Number(args[0]) || '' }] });
      if (!domain) return message.channel.createMessage(`***${this.client.stores.emojis.error} The domain or port you provided could not be found.***`);
      const edit = await message.channel.createMessage(`***${this.client.stores.emojis.loading} Deleting domain...***`);
      const embed = new RichEmbed();
      embed.setTitle('Domain Deletion');
      embed.addField('Account Username', domain.account.username, true);
      embed.addField('Account ID', domain.account.userID, true);
      embed.addField('Domain', domain.domain, true);
      embed.addField('Port', String(domain.port), true);
      embed.setFooter(this.client.user.username, this.client.user.avatarURL);
      embed.setTimestamp();
      if (domain.domain.includes('cloud.libraryofcode.org')) {
        const resultID = await axios({
          method: 'get',
          url: `https://api.cloudflare.com/client/v4/zones/5e82fc3111ed4fbf9f58caa34f7553a7/dns_records?name=${domain.domain}`,
          headers: { Authorization: `Bearer ${this.client.config.cloudflare}` },
        });
        this.client.signale.debug(resultID.data);
        if (resultID.data.result[0]) {
          const recordID = resultID.data.result[0].id;
          await axios({
            method: 'delete',
            url: `https://api.cloudflare.com/client/v4/zones/5e82fc3111ed4fbf9f58caa34f7553a7/dns_records/${recordID}`,
            headers: { Authorization: `Bearer ${this.client.config.cloudflare}` },
          });
        }
      }
      try {
        await fs.unlink(`/etc/nginx/sites-enabled/${domain.domain}`);
        await fs.unlink(`/etc/nginx/sites-available/${domain.domain}`);
      } catch (e) { this.client.signale.error(e); }
      await this.client.db.Domain.deleteOne({ domain: domain.domain });
      await this.client.util.exec('systemctl reload nginx');
      edit.edit(`***${this.client.stores.emojis.success} Domain ${domain.domain} with port ${domain.port} has been successfully deleted.***`);
      // @ts-ignore
      return message.channel.createMessage({ embed });
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
