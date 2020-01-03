import { Message } from 'eris';
import { Client } from '..';
import { Command } from '../class';

export default class Unban extends Command {
  constructor(client: Client) {
    super(client);

    this.name = 'unban';
    this.description = 'Unban an IP from Cloud/NGINX';
    this.aliases = ['unbanip'];
    this.usage = `${this.client.config.prefix}unban [service] [ip]`;
    this.permissions = { roles: ['455972169449734144', '662163685439045632'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args[1]) return this.client.commands.get('help').run(message, [this.name]);
      const msg = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Unbanning IP...***`);
      try {
        await this.client.util.exec(`sudo fail2ban-client set ${args[0]} unbanip ${args[1]}`);
      } catch (error) {
        if (error.message.includes('is not banned')) return msg.edit(`${this.client.stores.emojis.error} ***IP address not banned***`);
        if (error.message.includes(`'${args[0]}'`)) return msg.edit(`${this.client.stores.emojis.error} ***Invalid service***`);
        throw error;
      }

      message.delete();
      return msg.edit(`${this.client.stores.emojis.success} ***IP address ${args[1]} unbanned from ${args[0].toUpperCase()}***`);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
