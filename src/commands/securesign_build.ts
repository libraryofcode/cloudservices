import { Message } from 'eris';
import { Client } from '..';
import { Command, RichEmbed } from '../class';

export default class SecureSign_Build extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'build';
    this.description = 'Shows information about the current build of the CLI';
    this.usage = `${this.client.config.prefix}securesign build`;
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      const msg = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Loading build information...***`);

      const build = await this.client.util.exec("sudo -H -u root bash -c 'securesign-canary build'");
      const info = build.replace(/^\s+|\s+$/g, '').replace(/\n/g, '\n**').replace(/: /g, ':** ').split('\n');
      const title = info.shift();
      const description = info.join('\n');
      const content = '';

      const embed = new RichEmbed();
      embed.setTitle(title);
      embed.setDescription(description);
      embed.setAuthor(this.client.user.username, this.client.user.avatarURL);
      embed.setFooter(`Requested by ${message.member.username}#${message.member.discriminator}`, message.member.avatarURL);

      // @ts-ignore
      msg.edit({ content, embed });
    } catch (error) {
      this.client.util.handleError(error, message, this);
    }
  }
}
