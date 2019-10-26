import { Message, TextChannel } from 'eris';
import { Client, config } from '..';
import Command from '../class/Command';

const { prefix } = config;

export default class {
    public client: Client

    constructor(client: Client) {
      this.client = client;
    }

    public async run(message: Message) {
      try {
        const noPrefix: string[] = message.content.slice(prefix.length).trim().split(/ +/g);
        const command: string = noPrefix[0].toLowerCase();
        const resolved: Command = this.client.util.resolveCommand(command);
        if (!resolved) return;
        if (resolved.guildOnly && !(message.channel instanceof TextChannel)) return;
        const hasUserPerms: boolean = resolved.permissions.users.includes(message.author.id);
        let hasRolePerms: boolean = false;
        for (const role of resolved.permissions.roles) {
          if (message.member && message.member.roles.includes(role)) {
            hasRolePerms = true; break;
          }
        }
        if (!hasRolePerms && !hasUserPerms) return;
        if (!resolved.enabled) { message.channel.createMessage(`***${this.client.stores.emojis.error} This command has been disabled***`); return; }
        const args: string[] = noPrefix.slice(1);
        resolved.run(message, args);
      } catch (error) {
        this.client.util.handleError(error, message);
      }
    }
}
