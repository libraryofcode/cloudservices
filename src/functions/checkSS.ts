/* eslint-disable no-await-in-loop */
import axios from 'axios';
import { inspect } from 'util';
import { Client } from '..';

export default function checkSS(client: Client) {
  setInterval(async () => {
    try {
      const accounts = await client.db.Account.find();
      const hashes = accounts.filter((h) => h.hash);
      for (const { userID, homepath } of hashes) {
        try {
          const hash = client.util.getAcctHash(homepath);
          if (userID === '397432516010835970') client.getDMChannel(userID).then((c) => c.createMessage(hash));
          await axios({
            method: 'get',
            url: 'https://api.securesign.org/account/details',
            headers: { Authorization: hash },
          });
        } catch (error) {
          const { status } = error.response;
          if (userID === '397432516010835970') {
            const hi = inspect(error.response, { depth: 0 });
            client.getDMChannel(userID).then((c) => c.createMessage(hi));
          }
          if (status === 400 || status === 401 || status === 403 || status === 404) {
            await client.db.Account.updateOne({ userID }, { $set: { hash: false } });
            client.getDMChannel(userID).then((channel) => channel.createMessage('Your SecureSign password has been reset - please reinitialize your SecureSign account')).catch();
          }
        }
      }
    } catch (error) {
      client.util.handleError(error);
    }
  }, 60000);
}
