/* eslint-disable no-await-in-loop */
import axios from 'axios';
import { inspect } from 'util';
import { Client } from '..';

let interval: NodeJS.Timeout;
export default function checkSS(client: Client) {
  interval = setInterval(async () => {
    try {
      const accounts = await client.db.Account.find();
      for (const { userID, homepath, hash } of accounts) {
        try {
          const Authorization = client.util.getAcctHash(homepath);
          if (hash === null) throw new Error('Unable to locate auth file, homepath is probably incorrect');
          await axios({
            method: 'get',
            url: 'https://api.securesign.org/account/details',
            headers: { Authorization },
          });
          if (!hash) {
            await client.db.Account.updateOne({ userID }, { $set: { hash: true } });
            client.getDMChannel(userID).then((channel) => channel.createMessage('Your SecureSign account has been automatically initialized via the SecureSign CLI.')).catch();
          }
        } catch (error) {
          if (!hash) return;
          const { status } = error.response;
          if (status === 400 || status === 401 || status === 403 || status === 404) {
            await client.db.Account.updateOne({ userID }, { $set: { hash: false } });
            client.getDMChannel(userID).then((channel) => channel.createMessage('Your SecureSign password has been reset - please reinitialize your SecureSign account. Run `=securesign init` for more information')).catch();
          }
        }
      }
    } catch (error) {
      client.util.handleError(error);
    }
  }, 60000);
  return interval;
}

export function clear() {
  clearTimeout(interval);
}
