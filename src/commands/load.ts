import { Message } from 'eris';
import { Client } from '..';
import { Command } from '../class';

export default class Load extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'load';
    this.description = '(Re)loads command, config or util';
    this.aliases = ['reload'];
    this.permissions = { users: ['253600545972027394', '278620217221971968'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args[0]) return this.client.commands.get('help').run(message, [this.name]);
      const allowed = ['config', 'util', 'command'];
      const type = args[0].toLowerCase();
      if (!allowed.includes(type)) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Invalid type to (re)load***`);

      const corepath = '/var/CloudServices/dist';
      if (type === 'config') {
        this.client.config = require(`${corepath}/config.json`);
        delete require.cache[`${corepath}/config.json`];
      } else if (type === 'util') {
        const Util = require(`${corepath}/class/Util`).default;
        this.client.util = new Util(this.client);
        delete require.cache[`${corepath}/class/Util.js`];
      } else {
        try {
          delete require.cache[`${corepath}/commands/index.js`];
          delete require.cache[`${corepath}/commands/${args[1]}.js`];
          const cmdIndex = require('../commands');
          let Cmd = cmdIndex[args[1]];
          if (!Cmd) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Could not find file***`);
          Cmd = require(`${corepath}/commands/${args[1]}`).default;
          this.client.commands.remove(args[1]);
          this.client.loadCommand(Cmd);
          delete require.cache[`${corepath}/commands/index.js`];
          delete require.cache[`${corepath}/commands/${args[1]}.js`];
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
