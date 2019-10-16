import { Message } from 'eris';
import { Client, Util } from '..';
import { Command } from '../class';

export default class Ping extends Command {
  util: Util = new Util(this.client)

  constructor(client: Client) {
    super(client);
    this.name = 'ping';
    this.description = 'Pings the bot';
    this.enabled = true;
  }

  public async run(message: Message) {
    try {
      const clientStart: number = Date.now();
      const msg: Message = await message.channel.createMessage('🏓 Pong!');
      msg.edit(`🏓 Pong!\nClient: \`${Date.now() - clientStart}ms\`\nResponse: \`${msg.createdAt - message.createdAt}ms\``);
    } catch (error) {
      this.util.handleError(error, message, this);
    }
  }
}
