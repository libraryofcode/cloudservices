import { Message } from 'eris';
import { Client } from '..';
import { Collection } from '.';

export default class Command {
    name: string

    description?: string

    usage?: string

    enabled: boolean

    aliases?: string[]

    client: Client

    permissions?: { roles?: string[], users?: string[] }

    guildOnly?: boolean

    subcmds?: any[]

    subcommands?: Collection

    public run(message: Message, args: string[]) {} // eslint-disable-line

    constructor(client: Client) {
      this.name = 'None';
      this.description = 'No description given';
      this.usage = 'No usage given';
      this.enabled = true;
      this.aliases = [];
      this.guildOnly = true;
      this.client = client;
      this.subcmds = [];
      this.permissions = {};
    }
}
