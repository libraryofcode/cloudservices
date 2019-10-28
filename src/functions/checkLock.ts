import uuid from 'uuid/v4';
import { Client } from '..';
import { RichEmbed } from '../class';

export default function checkLock(client: Client) {
  setInterval(async () => {
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
          const mod = new client.db.Moderation({
            username: account.username,
            userID: account.userID,
            logID: uuid(),
            moderatorID: client.user.id,
            reason: 'Auto',
            type: 3,
            date: new Date(),
          });
          await mod.save();
          const embed = new RichEmbed();
          embed.setTitle('Account Infraction | Unlock');
          embed.setColor(3066993);
          embed.addField('User', `${account.username} | <@${account.userID}>`, true);
          embed.addField('Supervisor', 'SYSTEM', true);
          embed.addField('Reason', 'Auto', true);
          embed.setFooter(client.user.username, client.user.avatarURL);
          embed.setTimestamp();
          client.getDMChannel(account.userID).then((user) => {
            // @ts-ignore
            user.createMessage({ embed });
          });
          // @ts-ignore
          client.createMessage('580950455581147146', { embed });
          client.signale.complete(`Unlocked account ${account.username} | Queue date at ${moderation.expiration.date.toLocaleString('en-us')}`);
        }
      });
    } catch (error) {
      await client.util.handleError(error);
    }
  }, 10000);
}
