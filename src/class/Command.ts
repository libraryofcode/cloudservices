import { Message } from 'eris';
import { Client } from '..';

export default class Command {
    name: string

    description?: string

    usage?: string

    enabled: boolean

    aliases?: string[]

    client: Client

    permissions?: { roles?: string[], users?: string[] }

    guildOnly?: boolean

    subcommands: Map<string, Command>

    public run(message: Message, args: string[]) {} // eslint-disable-line

    constructor(client: Client) {
      this.name = 'None';
      this.description = 'No description given';
      this.usage = 'No usage given';
      this.enabled = true;
      this.aliases = [];
      this.guildOnly = true;
      this.client = client;
      this.subcommands = new Map();
      this.permissions = {};
    }
}
