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
      let evalString: string;
      let evaled: any;
      let depth = 0;
      this.client.signale.note('Received');
      this.client.signale.note(message);
      this.client.signale.note(args);

      if (args[0] && args[0].startsWith('-d')) {
        this.client.signale.note('Depth flag');
        depth = Number(args[0].replace('-d', ''));
        if (!depth || depth < 0) depth = 0;
        this.client.signale.note('Depth set');
        args.shift();
        evalString = args.join(' ').trim();
        this.client.signale.note('Eval reconfigured');
        this.client.signale.note(args);
      }
      if (args[0] === '-a' || args[0] === '-async') {
        this.client.signale.note('Async flag');
        args.shift();
        evalString = `(async () => { ${args.join(' ').trim()} })()`;
        this.client.signale.note('Eval reconfigured');
        this.client.signale.note(args);
      }

      this.client.signale.note('Main');
      this.client.signale.note(args);
      try {
        evaled = await eval(evalString);
        this.client.signale.note('evaluated with success');
        this.client.signale.note(evaled);
        this.client.signale.note(typeof evaled);
        if (typeof evaled !== 'string') {
          this.client.signale.note('Eval returned not a string. Depth setting:');
          this.client.signale.note(depth);
          evaled = inspect(evaled, { depth });
          this.client.signale.note('Inspected');
        }
        if (evaled === undefined) {
          this.client.signale.note('Eval undefined');
          evaled = 'undefined';
        }
      } catch (error) {
        this.client.signale.note('Error caught');
        evaled = error.stack;
      }

      this.client.signale.note('Eval finished');
      evaled = evaled.replace(new RegExp(this.client.config.token, 'gi'), 'juul');
      evaled = evaled.replace(new RegExp(this.client.config.emailPass, 'gi'), 'juul');
      evaled = evaled.replace(new RegExp(this.client.config.cloudflare, 'gi'), 'juul');
      this.client.signale.note('Masked');


      const display = this.client.util.splitString(evaled, 1975);
      this.client.signale.note('Split output');
      if (display[5]) {
        this.client.signale.note('Output greater than 5 messages');
        try {
          const { data } = await axios.post('https://snippets.cloud.libraryofcode.org/documents', display.join(''));
          this.client.signale.note('Data sent');
          return message.channel.createMessage(`${this.client.stores.emojis.success} Your evaluation evaled can be found on https://snippets.cloud.libraryofcode.org/${data.key}`);
        } catch (error) {
          this.client.signale.note('Error posting');
          return message.channel.createMessage(`${this.client.stores.emojis.error} ${error}`);
        }
      }

      this.client.signale.note('Single message');
      return display.forEach((m) => message.channel.createMessage(`\`\`\`js\n${m}\n\`\`\``));
    } catch (error) {
      this.client.signale.note('Global error caught');
      return this.client.util.handleError(error, message, this);
    }
  }
}
