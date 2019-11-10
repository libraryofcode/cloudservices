/* eslint-disable no-await-in-loop */
import fs from 'fs-extra';
import { Client } from '..';

export default function storage(client: Client) {
  setInterval(async () => {
    const accounts = await client.db.Account.find();
    for (const account of accounts) {
      let bytes = Number(await client.util.exec(`du -bs /home/${account.username}`));
      try {
        await fs.access(`/var/mail/${account.username}`, fs.constants.F_OK);
        bytes += Number(await client.util.exec(`du -bs /var/mail/${account.username}`));
      } catch {
        bytes += 0;
      }
      await client.redis.set(`storage-${account.username}`, bytes);
    }
  }, 300000);
}
