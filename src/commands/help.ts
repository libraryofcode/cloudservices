import { Message } from 'eris';
import { createPaginationEmbed } from 'eris-pagination';
import { Client } from '..';
import { Command, RichEmbed } from '../class';

export default class Help extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'help';
    this.description = 'Display a list of commands';
    this.usage = `${this.client.config.prefix}help | ${this.client.config.prefix}help ping`;
    this.aliases = ['commands'];
    this.enabled = true;
  }

  // eslint-disable-next-line consistent-return
  public async run(message: Message, args?: string[]) {
    try {
      if (!args[0]) {
        const cmdList: Command[] = [];
        this.client.commands.forEach((c) => cmdList.push(c));
        const commands = this.client.commands.map((c) => {
          const aliases = c.aliases.map((alias) => `${this.client.config.prefix}${alias}`).join(', ');
          const perms: string[] = [];
          let allowedRoles = c.permissions && c.permissions.roles && c.permissions.roles.map((r) => `<@&${r}>`).join(', ');
          if (allowedRoles) { allowedRoles = `**Roles:** ${allowedRoles}`; perms.push(allowedRoles); }
          let allowedUsers = c.permissions && c.permissions.users && c.permissions.users.map((u) => `<@${u}>`).join(', ');
          if (allowedUsers) { allowedUsers = `**Users:** ${allowedUsers}`; perms.push(allowedUsers); }
          const displayedPerms = perms.length ? `**Permissions:**\n${perms.join('\n')}` : '';
          return { name: `${this.client.config.prefix}${c.name}`, value: `**Description:** ${c.description}\n**Aliases:** ${aliases}\n**Usage:** ${c.usage}\n${displayedPerms}`, inline: false };
        });

        const splitCommands = this.client.util.splitFields(commands);
        const cmdPages: RichEmbed[] = [];
        splitCommands.forEach((splitCmd) => {
          const embed = new RichEmbed();
          embed.setTimestamp(); embed.setFooter(`Requested by ${message.author.username}#${message.author.discriminator}`, message.author.avatarURL);
          embed.setAuthor(`${this.client.user.username}#${this.client.user.discriminator}`, this.client.user.avatarURL);
          embed.setDescription(`Command list for ${this.client.user.username}`);
          splitCmd.forEach((c) => embed.addField(c.name, c.value, c.inline));
          return cmdPages.push(embed);
        });
        // @ts-ignore
        if (cmdPages.length === 1) return message.channel.createMessage({ embed: cmdPages[0] });
        return createPaginationEmbed(message, this.client, cmdPages);
      }
      const { cmd } = await this.client.util.resolveCommand(args[0], args.slice(1), message);
      if (!cmd) return message.channel.createMessage(`${this.client.stores.emojis.error} **Command not found!**`);
      const perms: string[] = [];
      let allowedRoles = cmd.permissions && cmd.permissions.roles && cmd.permissions.roles.map((r) => `<@&${r}>`).join(', ');
      if (allowedRoles) { allowedRoles = `**Roles:** ${allowedRoles}`; perms.push(allowedRoles); }
      let allowedUsers = cmd.permissions && cmd.permissions.users && cmd.permissions.users.map((u) => `<@${u}>`).join(', ');
      if (allowedUsers) { allowedUsers = `**Users:** ${allowedUsers}`; perms.push(allowedUsers); }
      const displayedPerms = perms.length ? `\n**Permissions:**\n${perms.join('\n')}` : '';
      const aliases = cmd.aliases.length ? `\n**Aliases:** ${cmd.aliases.map((alias) => `${this.client.config.prefix}${cmd.parentName}${alias}`).join(', ')}` : '';
      const subcommands = cmd.subcommands.size ? `\n**Subcommands:** ${cmd.subcommands.map((s) => `${cmd.name} ${s.name}`).join(', ')}` : '';
      const embed = new RichEmbed();
      embed.setTimestamp(); embed.setFooter(`Requested by ${message.author.username}#${message.author.discriminator}`, message.author.avatarURL);
      embed.setTitle(`${this.client.config.prefix}${cmd.parentName ? `${cmd.parentName}${cmd.name}` : cmd.name}`); embed.setAuthor(`${this.client.user.username}#${this.client.user.discriminator}`, this.client.user.avatarURL);
      const description = `**Description**: ${cmd.description}\n**Usage:** ${cmd.usage}${aliases}${displayedPerms}${subcommands}`;
      embed.setDescription(description);
      // @ts-ignore
      message.channel.createMessage({ embed });
    } catch (error) {
      this.client.util.handleError(error, message, this);
    }
  }
}
