import { Message } from 'eris';
import { Client } from '..';
import { Command } from '../class';

export default class Pull extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'pull';
    this.description = 'Fetches the latest commit from Gitlab';
    this.aliases = ['update'];
    this.enabled = true;
    this.permissions = { users: ['253600545972027394', '278620217221971968'] };
  }

  public async run(message: Message) {
    try {
      const updateMessage = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Fetching latest commit...***`);
      let pull: string;
      try {
        pull = await this.client.util.exec('cd ../ && git pull');
      } catch (error) {
        return updateMessage.edit(`${this.client.stores.emojis.error} ***Could not fetch latest commit***\n\`\`\`sh\n${error.message}\n\`\`\``);
      }
      if (pull.includes('Already up to date')) return updateMessage.edit(`${this.client.stores.emojis.success} ***No updates available***`);
      return message;
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
