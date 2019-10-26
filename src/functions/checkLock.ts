import Client from '../Client';
import { RichEmbed } from '../class';

export default function checkLock(client: Client) {
  setTimeout(async () => {
    try {
      const moderations = await client.db.Moderation.find();
      moderations.forEach(async (moderation) => {
        if (!moderation.expiration) return;
        if (moderation.expiration.processed) return;
        if (new Date() > moderation.expiration.date) {
          const account = await client.db.Account.findOne({ username: moderation.username });
          if (!account) return;
          await client.util.exec(`unlock ${account.username}`);
          const embed = new RichEmbed();
          embed.setTitle('Cloud Infraction | Unlock');
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
        }
      });
    } catch (error) {
      await client.util.handleError(error);
    }
  });
}
