import { Message } from 'eris';
import axios from 'axios';
import { Client } from '..';
import { Command, RichEmbed } from '../class';

export default class SecureSign_ActivateKey extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'activatekey';
    this.description = 'Claims an Activation Key';
    this.usage = `${this.client.config.prefix}securesign activatekey [key]`;
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args[0]) return this.client.commands.get('help').run(message, ['securesign', this.name]);
      const account = await this.client.db.Account.findOne({ userID: message.author.id });
      if (!account) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not found***`);
      if (!account.hash) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not initialized***`);
      const msg = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Activating key...***`);
      try {
        await axios({
          method: 'POST',
          url: 'https://api.securesign.org/account/keys/activation',
          headers: { Authorization: account.hash, 'Content-Type': 'application/json' },
          data: JSON.stringify({ key: args[0] }),
        });
      } catch (error) {
        const { code } = error.response.data;
        if (code === 1001) {
          await this.client.db.Account.updateOne({ hash: account.hash }, { $set: { hash: null } });
          this.client.getDMChannel(account.userID).then((channel) => channel.createMessage('Your SecureSign password has been reset - please reinitialize your SecureSign account')).catch();
          return msg.edit(`${this.client.stores.emojis.error} ***Authentication failed***`);
        }
        if (code === 1002) return msg.edit(`${this.client.stores.emojis.error} ***Invalid Activation Key***`);
        if (code === 1003) return msg.edit(`${this.client.stores.emojis.error} ***${error.response.data.message}***`);
        throw error;
      }
      return msg.edit(`${this.client.stores.emojis.success} ***Activation Key Accepted***`);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
