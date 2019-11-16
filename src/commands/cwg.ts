import { Message } from 'eris';
import { Command } from '../class';
import { Client } from '..';
import Create from './cwg_create';
import Data from './cwg_data';
import Delete from './cwg_delete';

export default class CWG extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'cwg';
    this.description = 'Manages aspects for the CWG.';
    this.usage = `Run ${this.client.config.prefix}${this.name} [subcommand] for usage information`;
    this.permissions = { roles: ['446104438969466890'] };
    this.subcmds = [Create, Data, Delete];
    this.enabled = true;
  }

  public async run(message: Message) {
    try {
      return this.client.commands.get('help').run(message, [this.name]);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
