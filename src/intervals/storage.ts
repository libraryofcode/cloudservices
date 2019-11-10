/* eslint-disable no-await-in-loop */
import fs from 'fs-extra';
import { Client } from '..';

export default function storage(client: Client) {
  const main = async () => {
    const accounts = await client.db.Account.find();
    for (const account of accounts) {
      const res = await client.util.exec(`du -bs /home/${account.username}`);
      let bytes = Number(res.split('/')[0].replace('\t', ''));
      try {
        await fs.access(`/var/mail/${account.username}`, fs.constants.F_OK);
        bytes += Number(res.split('/')[0].replace('\t', ''));
      } catch {
        bytes += 0;
      }
      await client.redis.set(`storage-${account.username}`, bytes);
    }
  };
  setInterval(async () => {
    await main();
  }, 300000);
}
