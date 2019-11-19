import { Message } from 'eris';
import { Client } from '..';
import { Command } from '../class';

export default class Restart extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'restart';
    this.description = 'Restart the bot';
    this.permissions = { users: ['253600545972027394', '278620217221971968'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (this.client.updating && args[0] !== '-f') return message.channel.createMessage(`${this.client.stores.emojis.error} ***Update in progress***`);
      await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Restarting...***`);
      return process.exit(1);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
