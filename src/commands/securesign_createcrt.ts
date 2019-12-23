import { Message, PrivateChannel, TextChannel } from 'eris';
import axios from 'axios';
import { Client } from '..';
import { Command } from '../class';

export default class SecureSign_Init extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'createcrt';
    this.description = 'Creates a new certificate';
    this.usage = `${this.client.config.prefix}securesign createcrt [-s sign] [-c class] [-m digest]\n\`sign\`: Sign type (ecc/rsa)\n\`class\`: Certificate Class (1/2/3)\n\`digest\`: SHA Digest (256/384/512)`;
    this.enabled = true;
    this.guildOnly = false;
  }

  public async run(message: Message, args: string[]) {
    try {
      const account = await this.client.db.Account.findOne({ userID: message.author.id });
      if (!account) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not found***`);
      if (!account.hash) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not initialized***`);

      // @ts-ignore
      const options: { s?: string, c?: string, m?: string } = args.length ? Object.fromEntries(` ${args.join(' ')}`.split(' -').filter((a) => a).map((a) => a.split(' '))) : {}; // eslint-disable-line
      if (options.s && options.s.toLowerCase() !== 'ecc' && options.s.toLowerCase() !== 'rsa') return message.channel.createMessage(`${this.client.stores.emojis.error} ***Invalid signing type, choose between \`ecc\` or \`rsa\``);
      if (options.c && (!Number(options.c) || Number(options.c) < 1 || Number(options.c) > 3)) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Invalid class selected, choose between Class \`1\`, \`2\` or \`3\``);
      if (options.m && (!Number(options.m) || (options.m !== '256' && options.m !== '384' && options.m !== '512'))) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Invalid SHA Digest selected, choose between \`256\`, \`384\` or \`512\``);

      const msg = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Creating certificate...***`);
      const hash = this.client.util.getAcctHash(account.homepath);

      // Check if they can generate certificate
      try {
        const { data } = await axios({
          method: 'GET',
          url: 'https://api.securesign.org/account/details',
          headers: { Authorization: hash, 'Content-Type': 'application/json' },
        });

        const { total, allowed } = data.message;
        if (total >= allowed) return msg.edit(`${this.client.stores.emojis.error} ***Not enough certificate allowances - please ask a member of staff to increase this limit from ${total}***`);
        if (Number(options.c) > data.message.class) return msg.edit(`${this.client.stores.emojis.error} ***Class too low, you are on a class ${data.message.class} account***`);
      } catch (error) {
        const { code } = error.response.data;
        if (code === 1001) {
          await this.client.db.Account.updateOne({ userID: account.userID }, { $set: { hash: false } });
          this.client.getDMChannel(account.userID).then((channel) => channel.createMessage('Your SecureSign password has been reset - please reinitialize your SecureSign account')).catch();
          return msg.edit(`${this.client.stores.emojis.error} ***Authentication failed***`);
        }
        throw error;
      }

      const execoptions = `${options.s ? ` -s ${options.s}` : ''}${options.c ? ` -c ${options.c}` : ''}${options.m ? ` -m ${options.m}` : ''}`;
      const cmd = `sudo -H -u ${account.username} bash -c 'securesign-canary createcrt${execoptions}'`;

      const exec = await this.client.util.exec(cmd);
      if (!exec.replace(/^\s+|\s+$/g, '').endsWith('Successfully wrote certificate.')) throw new Error(`Certificate generation did not complete successfully:\n${cmd}`);

      return msg.edit(`${this.client.stores.emojis.success} ***Successfully created certificate***`);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
