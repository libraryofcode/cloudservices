import { Message } from 'eris';
import Client from '../Client';
import Command from '../class/Command';

export default class Ping extends Command {
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
      this.client.util.handleError(error, message, this);
    }
  }
}
