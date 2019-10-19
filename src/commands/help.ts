import { Message } from 'eris';
import { createPaginationEmbed } from 'eris-pagination';
import { Client, Util, config } from '..';
import { Command, RichEmbed } from '../class';

export default class Help extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'help';
    this.description = 'Display a list of commands';
    this.usage = `${config.prefix}help | ${config.prefix}help ping`;
    this.aliases = ['commands'];
    this.enabled = true;
  }

  util: Util = new Util(this.client);

  public async run(message: Message, args?: string[]) {
    try {
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

      const splitCommands = this.util.splitFields(commands);
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
    const foundCommand = this.util.resolveCommand(cmd);
    if (!foundCommand) return message.channel.createMessage(`${this.client.stores.emojis.error} **Command not found!**`);
    const perms: string[] = [];
    let allowedRoles = foundCommand.permissions && foundCommand.permissions.roles && foundCommand.permissions.roles.map((r) => `<@&${r}>`).join(', ');
    if (allowedRoles) { allowedRoles = `**Roles:** ${allowedRoles}`; perms.push(allowedRoles); }
    let allowedUsers = foundCommand.permissions && foundCommand.permissions.users && foundCommand.permissions.users.map((u) => `<@${u}>`).join(', ');
    if (allowedUsers) { allowedUsers = `**Users:** ${allowedUsers}`; perms.push(allowedUsers); }
    const displayedPerms = perms.length ? `**Permissions:**\n${perms.join('\n')}` : '';
    const aliases = foundCommand.aliases.map((alias) => `${config.prefix}${alias}`).join(', ');
    const embed = new RichEmbed();
    embed.setTimestamp(); embed.setFooter(`Requested by ${message.author.username}#${message.author.discriminator}`, message.author.avatarURL);
    embed.setTitle(`${config.prefix}${foundCommand.name}`); embed.setAuthor(`${this.client.user.username}#${this.client.user.discriminator}`, this.client.user.avatarURL);
    const description = `**Description**: ${foundCommand.description}\n**Usage:** ${foundCommand.usage}\n**Aliases:** ${aliases}\n**Permissions**: ${displayedPerms}`;
    embed.setDescription(description);
    // @ts-ignore
    return message.channel.createMessage({ embed });
    } catch (error) {
      this.util.handleError(error, message, this)
    }
  }
}
