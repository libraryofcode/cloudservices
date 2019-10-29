import { Message, TextChannel } from 'eris';
import { Client } from '..';
import Command from '../class/Command';

export default class {
    public client: Client

    constructor(client: Client) {
      this.client = client;
    }

    public async run(message: Message) {
      try {
        if (message.author.bot) return;
        if (message.content.indexOf(this.client.config.prefix) !== 0) return;
        const noPrefix: string[] = message.content.slice(this.client.config.prefix.length).trim().split(/ +/g);
        const command: string = noPrefix[0].toLowerCase();
        const Args = noPrefix.slice(1);
        const resolved: { command: Command, args: string[] } = this.client.util.resolveCommand(command, Args);
        if (!resolved) return;
        if (resolved.command.guildOnly && !(message.channel instanceof TextChannel)) return;
        let hasUserPerms: boolean;
        if (resolved.command.permissions.users) {
          hasUserPerms = resolved.command.permissions.users.includes(message.author.id);
        }
        let hasRolePerms: boolean = false;
        if (resolved.command.permissions.roles) {
          for (const role of resolved.command.permissions.roles) {
            if (message.member && message.member.roles.includes(role)) {
              // this.client.signale.debug(message.member.roles.includes(role));
              hasRolePerms = true; break;
            }
          }
        }
        if (!resolved.command.permissions.users && !resolved.command.permissions.roles) {
          hasUserPerms = true;
          hasRolePerms = true;
        }
        if (!hasRolePerms && !hasUserPerms) return;
        if (!resolved.command.enabled) { message.channel.createMessage(`***${this.client.stores.emojis.error} This command has been disabled***`); return; }
        resolved.command.run(message, resolved.args);
      } catch (error) {
        this.client.util.handleError(error, message);
      }
    }
}
