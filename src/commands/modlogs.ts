import { Message } from 'eris';
import { createPaginationEmbed } from 'eris-pagination';
import { Client, Util } from '..';
import { Command, RichEmbed } from '../class';

export default class Modlogs extends Command {
  util: Util = new Util(this.client)

  constructor(client: Client) {
    super(client);
    this.name = 'modlogs';
    this.description = 'Check a user\'s Cloud Modlogs';
    this.aliases = ['infractions', 'modlog'];
    this.enabled = true;
    this.permissions = { roles: ['446104438969466890'] };
  }

  public async run(message: Message, args: string[]) {
    try {
      const msg: Message = await message.channel.createMessage(`***${this.client.stores.emojis.loading} Locating modlogs...***`);
      const query = await this.client.db.Moderation.find({ $or: [{ account: args.join(' ') }, { userID: args.filter((a) => a)[0].replace(/[<@!>]/g, '') }] });
      if (!query.length) return msg.edit(`***${this.client.stores.emojis.error} Cannot locate modlogs for ${args.join(' ')}***`);

      let index = 0; const logs: {name: string, value: string, inline: boolean}[][] = [[]];
      const formatted = query.map((log) => {
        const { account, moderatorID, reason, type, date } = log;
        const name = type;
        const value = `**Account name:** ${account}\n**Moderator:** <@${moderatorID}>\n**Reason:** ${reason}\n**Date:** ${date.toLocaleString('en-us')} EST`;
        const inline = true;
        return { name, value, inline };
      });
      const users = [...new Set(query.map((log) => log.userID))].map((u) => `<@${u}>`);

      while (query.length) {
        if (logs[index].length >= 25) { index += 1; logs[index] = []; }
        logs[index].push(formatted[0]); formatted.shift();
      }

      const embeds = logs.map((l) => {
        const embed = new RichEmbed();
        embed.setDescription(`List of Cloud moderation logs for ${users.join(', ')}`);
        embed.setAuthor('Library of Code | Cloud Services', this.client.user.avatarURL, 'https://libraryofcode.us');
        embed.setTitle('Cloud Modlogs/Infractions');
        embed.setFooter(`Requested by ${message.author.username}#${message.author.discriminator}`, message.author.avatarURL);
        l.forEach((f) => embed.addField(f.name, f.value, f.inline));
        embed.setTimestamp();
        embed.setColor(3447003);
        return embed;
      });

      createPaginationEmbed(message, this.client, embeds, {}, msg);
      return msg;
    } catch (error) {
      return this.util.handleError(error, message, this);
    }
  }
}
