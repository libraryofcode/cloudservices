import { Message } from 'eris';
import { Client, Util, config } from '..';
import { Command, RichEmbed } from '../class';

export default class Help extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'help';
    this.description = 'Display a list of commands';
    this.usage = `${config.prefix}help | ${config.prefix}help ping`;
    this.enabled = true;
  }

  util: Util = new Util(this.client);

  public async run(message: Message, args?: string[]) {
    const cmd = args.filter((c) => c)[0];
    if (!cmd) {
      const cmdList: Command[] = [];
      this.client.commands.forEach((c) => cmdList.push(c));
      const commands = cmdList.map((c) => {
        const aliases = c.aliases.map((alias) => `${config.prefix}${alias}`).join(', ');
        const perms: string[] = [];
        let allowedRoles = c.permissions && c.permissions.roles && c.permissions.roles.map((r) => `<@&${r}>`).join(', ');
        if (allowedRoles) { allowedRoles = `**Roles:** ${allowedRoles}`; perms.push(allowedRoles); }
        let allowedUsers = c.permissions && c.permissions.users && c.permissions.users.map((u) => `<@${u}>`).join(', ');
        if (allowedUsers) { allowedUsers = `**Users:** ${allowedUsers}`; perms.push(allowedUsers); }
        const displayedPerms = perms.length ? `**Permissions:**\n${perms.join('\n')}` : '';
        return { name: `${config.prefix}${c.name}`, value: `**Description:** ${c.description}\n**Aliases:** ${aliases}\n**Usage:** ${c.usage}\n${displayedPerms}`, inline: true };
      });

      const embed = new RichEmbed();
      embed.setTimestamp(); embed.setFooter(`Requested by ${message.author.username}#${message.author.discriminator}`, message.author.avatarURL);
      embed.setAuthor(`${this.client.user.username}#${this.client.user.discriminator}`, this.client.user.avatarURL);
    }
  }
}
