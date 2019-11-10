/* eslint-disable no-await-in-loop */
import fs from 'fs-extra';
import { Client } from '..';

export default async function storage(client: Client) {
  const main = async () => {
    const accounts = await client.db.Account.find();
    for (const account of accounts) {
      const res = await client.util.exec(`du -bs /home/${account.username}`);
      let bytes = Number(res.split('/')[0].replace('\t', ''));
      try {
        await fs.access(`/var/mail/${account.username}`, fs.constants.F_OK);
        const res2 = await client.util.exec(`du -bs /var/mail/${account.username}`);
        bytes += Number(res2.split('/')[0].replace('\t', ''));
      } catch {
        bytes += 0;
      }
      await client.redis.set(`storage-${account.username}`, bytes);
    }
  };
  await main();
  setInterval(async () => {
    await main();
  }, 900000);
}
