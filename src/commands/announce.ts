import { Message } from 'eris';
import { Client } from '..';
import { Command } from '../class';

export default class Announce extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'announce';
    this.description = 'Sends an announcement to all active terminals';
    this.usage = `${this.client.config.prefix}announce Hi there! | ${this.client.config.prefix}announce -e EMERGENCY!`;
    this.aliases = ['ann'];
    this.permissions = { roles: ['608095934399643649', '521312697896271873'] };
    this.enabled = true;
  }

  public async run(message: Message, args?: string[]) {
    try {
      if (!args.length) return this.client.commands.get('help').run(message, [this.name]);
      const notification = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Sending announcement, please wait...***`);
      if (args[0] === '-e') await this.client.util.exec(`echo "\n\n**************************************************************************\nEMERGENCY SYSTEM BROADCAST MESSAGE | Library of Code sp-us (root enforced)\n--------------------------------------------------------------------------\n\n\n${args.slice(1).join(' ').trim()}\n\n\n\n\n\n\n\n\n\n\n\n\n" | wall -n`);
      else await this.client.util.exec(`echo "\nSYSTEM BROADCAST MESSAGE | Library of Code sp-us (root enforced)\n\n\n${args.join(' ').trim()}" | wall -n`);
      message.delete();
      return notification.edit(`${this.client.stores.emojis.success} ***Sent${args[0] === '-e' ? ' emergency' : ''} announcement to all active terminals***`);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
