import { Message } from 'eris';
import { Command } from '../class';
import { Client } from '..';
import Build from './securesign_build';
import Init from './securesign_init';
import Account from './securesign_account';
import ActivateKey from './securesign_activatekey';

export default class SecureSign extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'securesign';
    this.description = 'Runs SecureSign CLI commands';
    this.usage = `Run ${this.client.config.prefix}${this.name} [subcommand] for usage information`;
    this.aliases = ['ss'];
    this.subcmds = [Build, Init, Account, ActivateKey];
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
