import { Message } from 'eris';
import { Client } from '..';
import { Command } from '../class';

export default class Ping extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'load';
    this.description = '(Re)loads command, config or util';
    this.aliases = ['reload'];
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args[0]) return this.client.commands.get('help').run(message, [this.name]);
      const allowed = ['config', 'util', 'command', 'function'];
      const type = args[0].toLowerCase();
      if (!allowed.includes(type)) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Invalid type to (re)load***`);

      const corepath = '/var/CloudServices/dist';
      if (type === 'config') this.client.config = require(`${corepath}/config.json`);
      else if (type === 'util') {
        const Util = require(`${corepath}/class/Util`);
        this.client.util = new Util(this.client);
      } else {
        try {
          const Cmd = require(`${corepath}/commands`)[args[1]];
          this.client.commands.remove(args[1]);
          this.client.loadCommand(Cmd);
        } catch (error) {
          if (error.message.includes('Cannot find module')) return message.channel.createMessage(`${this.client.stores.emojis} ***Cannot find file***`);
          throw error;
        }
      }
      return message.channel.createMessage(`${this.client.stores.emojis.success} Reloaded ${type}`);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
