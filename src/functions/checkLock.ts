import { Client } from '..';

let interval: NodeJS.Timeout;

export default function checkLock(client: Client) {
  interval = setInterval(async () => {
    try {
      const moderations = await client.db.Moderation.find();
      moderations.forEach(async (moderation) => {
        if (!moderation.expiration) return;
        if (moderation.expiration.processed) return;
        if (new Date() > moderation.expiration.date) {
          const account = await client.db.Account.findOne({ username: moderation.username });
          if (!account) return;
          await client.util.exec(`unlock ${account.username}`);
          await moderation.updateOne({ 'expiration.processed': true });
          await account.updateOne({ locked: false });
          await client.util.createModerationLog(account.userID, client.user, 3, 'Auto');
          client.signale.complete(`Unlocked account ${account.username} | Queue date at ${moderation.expiration.date.toLocaleString('en-us')}`);
        }
      });
    } catch (error) {
      await client.util.handleError(error);
    }
  }, 10000);
  return interval;
}

export function clear() {
  clearInterval(interval);
}
