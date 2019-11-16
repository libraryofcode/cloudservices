import { Message, PrivateChannel, TextChannel } from 'eris';
import axios, { AxiosResponse } from 'axios';
import { Client } from '..';
import { Command } from '../class';

export default class SecureSign_Init extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'init';
    this.description = 'Inits configuration files and environment variables (DM only)';
    this.usage = `${this.client.config.prefix}securesign init [hash]`;
    this.enabled = true;
    this.guildOnly = false;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args[0]) return this.client.commands.get('help').run(message, ['securesign', this.name]);
      if (!(message.channel instanceof PrivateChannel)) {
        message.delete();
        return message.channel.createMessage(`${this.client.stores.emojis.error} ***Run this command in your DMs!***`);
      }
      const account = await this.client.db.Account.findOne({ userID: message.author.id });
      if (!account) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not registered***`);
      if (account.locked) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Your account is locked***`);
      const msg = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Initializing account...***`);
      let verify: AxiosResponse<any>;
      try {
        verify = await axios({
          method: 'get',
          url: 'https://api.securesign.org/account/details',
          headers: { Authorization: args[0] },
        });
      } catch (error) {
        const { status } = error.response;
        if (status === 400 || status === 401 || status === 403 || status === 404) return msg.edit(`${this.client.stores.emojis.error} ***Credentials incorrect***`);
        throw error;
      }
      const { id } = verify.data.message;
      if (id !== message.author.id && !account.root) {
        // @ts-ignore
        const channel: TextChannel = this.client.guilds.get('446067825673633794').channels.get('501089664040697858');
        channel.createMessage(`**__UNAUTHORIZED ACCESS ALERT__**\n${message.author.mention} tried to initialize their account using <@${id}>'s credentials.\nTheir account has been locked under Section 5.2 of the EULA.`);
        const tasks = [this.client.util.exec(`lock ${account.username}`), account.updateOne({ locked: true }), this.client.util.createModerationLog(account.userID, this.client.user, 2, 'Violation of Section 5.2 of the EULA')];
        await Promise.all(tasks);
        return msg.edit(`${this.client.stores.emojis.error} ***Credentials incorrect***`);
      }
      const init = await this.client.util.exec(`sudo -H -u ${account.username} bash -c 'securesign-canary init -a ${args[0]}'`);
      if (!init.endsWith('Initialization sequence completed.')) throw new Error('Account initialization did not complete successfully');
      return msg.edit(`${this.client.stores.emojis.success} ***Account initialized***`);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
