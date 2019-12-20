/* eslint-disable no-await-in-loop */
// import fs from 'fs-extra';
import { spawn } from 'child_process';
import { Client } from '..';

export default async function storage(client: Client) {
  /* const main = async () => {
    const accounts = await client.db.Account.find();
    for (const account of accounts) {
      setTimeout(async () => {
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
      }, 600000);
    }
  };
  await main();
  setInterval(async () => {
    await main();
  }, 900000); */
  let storageGo = spawn(`${__dirname}/../bin/storage`, []);
  storageGo.stdout.on('data', (data) => client.signale.log(data));
  storageGo.stderr.on('data', (data) => client.signale.log(data));
  storageGo.on('exit', (code) => {
    client.signale.log(`Go storage func exited with code ${code}, restarting`);
    storageGo = spawn(`${__dirname}/../bin/storage`, []);
  });
}
