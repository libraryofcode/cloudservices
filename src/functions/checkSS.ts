/* eslint-disable no-await-in-loop */
import axios from 'axios';
import { Client } from '..';

export default function checkSS(client: Client) {
  setInterval(async () => {
    try {
      const accounts = await client.db.Account.find();
      const hashes = accounts.filter((h) => h.hash);
      for (const { hash, userID } of hashes) {
        try {
          await axios({
            method: 'get',
            url: 'https://api.securesign.org/account/details',
            headers: { Authorization: hash },
          });
        } catch (error) {
          const { status } = error.response;
          if (status === 400 || status === 401 || status === 403 || status === 404) {
            await client.db.Account.updateOne({ hash }, { $set: { hash: null } });
            client.getDMChannel(userID).then((channel) => channel.createMessage('Your SecureSign password has been reset - please reinitialize your SecureSign account')).catch();
          }
        }
      }
    } catch (error) {
      client.util.handleError(error);
    }
  }, 60000);
}
