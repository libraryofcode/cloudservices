import { Message } from 'eris';
import axios from 'axios';
import fs from 'fs-extra';
import { Client } from '..';
import { Command } from '../class';

export default class SecureSign_Alliance extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'alliance';
    this.description = 'Claims an alliance/promo key';
    this.usage = `${this.client.config.prefix}securesign alliance [key]`;
    this.enabled = true;
    this.guildOnly = false;
  }

  public async run(message: Message, args: string[]) {
    try {
      const account = await this.client.db.Account.findOne({ userID: message.author.id });
      if (!account) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not found***`);
      if (!account.hash) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not initialized***`);

      const promocode = args[0];
      const splitPromo = promocode.split('-');
      if (splitPromo.length !== 5 || splitPromo.some((code) => code.length < 4 || code.length > 6)) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Invalid promotion code***`);

      const msg = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Activating key...***`);
      const Authorization = this.client.util.getAcctHash(account.homepath);

      // Check if they can activate promos
      try {
        const { data } = await axios({
          method: 'GET',
          url: 'https://api.securesign.org/account/details',
          headers: { Authorization, 'Content-Type': 'application/json' },
        });

        const { promo } = data.message;
        if (!promo) return msg.edit(`${this.client.stores.emojis.error} ***Please ask a member of staff to generate an activation key with promotions allowed***`);
      } catch (error) {
        const { code } = error.response.data;
        if (code === 1001) {
          await this.client.db.Account.updateOne({ userID: account.userID }, { $set: { hash: false } });
          this.client.getDMChannel(account.userID).then((channel) => channel.createMessage('Your SecureSign password has been reset - please reinitialize your SecureSign account')).catch();
          return msg.edit(`${this.client.stores.emojis.error} ***Authentication failed***`);
        }
        throw error;
      }

      let data: { URL: string };
      try {
        const request = await axios({
          method: 'POST',
          url: 'https://api.securesign.org/certificates/alliance/client',
          headers: { Authorization },
        });
        data = request.data;
      } catch (error) {
        const { code } = error.response.data;
        if (code === 1001) {
          await this.client.db.Account.updateOne({ userID: account.userID }, { $set: { hash: false } });
          this.client.getDMChannel(account.userID).then((channel) => channel.createMessage('Your SecureSign password has been reset - please reinitialize your SecureSign account')).catch();
          return msg.edit(`${this.client.stores.emojis.error} ***Authentication failed***`);
        }
        if (code === 1002) return msg.edit(`${this.client.stores.emojis.error} ***Server responded with ${error.message}`);
        throw error;
      }

      const certificate = await axios({ method: 'GET', url: data.URL });
      if (!fs.existsSync(`${account.homepath}/Validation/`)) await fs.mkdir(`${account.homepath}/Validation/`);
      await fs.writeFile(`${account.homepath}/Validation/${account.username}.crt`, certificate.data, { encoding: 'utf8' });

      return msg.edit(`${this.client.stores.emojis.success} ***Successfully activated key and created and saved certificate***`);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
