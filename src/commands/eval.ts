/* eslint-disable no-eval */
import { Message } from 'eris';
import { inspect } from 'util';
import axios from 'axios';
import { Client } from '..';
import { Command } from '../class';

export default class Eval extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'eval';
    this.aliases = ['e'];
    this.description = 'Evaluate JavaScript code';
    this.enabled = true;
    this.permissions = { users: ['253600545972027394', '278620217221971968', '155698776512790528'] };
    this.guildOnly = false;
  }

  public async run(message: Message, args: string[]) {
    try {
      // const evalMessage = message.content.slice(this.client.config.prefix.length).split(' ').slice(1).join(' ');
      let evalString = args.join(' ').trim();
      let evaled: any;
      let depth = 0;

      if (args[0] && args[0].startsWith('-d')) {
        depth = Number(args[0].replace('-d', ''));
        if (!depth || depth < 0) depth = 0;
        args.shift();
      }
      if (args[0] === '-a' || args[0] === '-async') {
        args.shift();
        evalString = `(async () => { ${evalString} })()`;
      }

      try {
        evaled = await eval(evalString);
        if (typeof evaled !== 'string') {
          evaled = inspect(evaled, { depth });
        }
        if (evaled === undefined) {
          evaled = 'undefined';
        }
      } catch (error) {
        evaled = error.stack;
      }

      evaled = evaled.replace(new RegExp(this.client.config.token, 'gi'), 'juul');
      evaled = evaled.replace(new RegExp(this.client.config.emailPass, 'gi'), 'juul');
      evaled = evaled.replace(new RegExp(this.client.config.cloudflare, 'gi'), 'juul');


      const display = this.client.util.splitString(evaled, 1975);
      if (display[5]) {
        try {
          const { data } = await axios.post('https://snippets.cloud.libraryofcode.org/documents', display.join(''));
          return message.channel.createMessage(`${this.client.stores.emojis.success} Your evaluation evaled can be found on https://snippets.cloud.libraryofcode.org/${data.key}`);
        } catch (error) {
          return message.channel.createMessage(`${this.client.stores.emojis.error} ${error}`);
        }
      }

      return display.forEach((m) => message.channel.createMessage(`\`\`\`js\n${m}\n\`\`\``));
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
