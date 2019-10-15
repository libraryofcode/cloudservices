import fs from 'fs-extra';
import { Message } from 'eris';
import Client from '../Client';
import Command from '../class/Command';

export default class Lock extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'lock';
    this.description = 'Locks an account.';
    this.permissions = { roles: ['608095934399643649', '521312697896271873'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) { // eslint-disable-line
    let account = await this.client.db.Account.findOne({ account: args[0] });
    if (!account) account = await this.client.db.Account.findOne({ userID: args[0].replace(/[<@!>]/gi, '') });
    if (!account) return message.channel.createMessage(`***${this.client.stores.emojis.error} Cannot find user.***`);
    const edit = await message.channel.createMessage(`***${this.client.stores.emojis.loading} Locking account...***`);
  }
}
