import { Message } from 'eris';
import { Client } from '..';
import { Command } from '../class';

export default class ResetPassword extends Command {
  constructor(client: Client) {
    super(client);

    this.name = 'resetpassword';
    this.description = 'Reset a cloud account password';
    this.aliases = ['resetpasswd', 'resetpw'];
    this.usage = `${this.client.config.prefix}resetpassword [Username | User ID | Email]`;
    this.permissions = { roles: ['525441307037007902', '475817826251440128'] };
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args[0]) return this.client.commands.get('help').run(message, [this.name]);
      const account = await this.client.db.Account.findOne({ $or: [{ username: args[0] }, { userID: args[0] }, { emailAddress: args[0] }] });
      if (!account) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account not found***`);

      const msg = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Resetting password for ${account.username}...***`);
      const tempPass = this.client.util.randomPassword();
      await this.client.util.exec(`echo '${account.username}:${tempPass}' | sudo chpasswd`);

      let completeMessage = `${this.client.stores.emojis.success} ***Password for ${account.userID} reset to \`${tempPass}\`***`;
      const dmChannel = await this.client.getDMChannel(account.userID);
      try {
        await dmChannel.createMessage(`We received a password reset request from you, your new password is \`${tempPass}\`.\n`
      + `You will be asked to change your password when you log back in, \`(current) UNIX password\` is \`${tempPass}\`, then create a password that is at least 12 characters long, with at least one number, special character, and an uppercase letter.\n`
      + 'Bear in mind that when you enter your password, it will be blank, so be careful not to type in your password incorrectly.');
      } catch (error) {
        if (error.code === 50007) completeMessage += '\n*Unable to DM user*';
        throw error;
      }
      return msg.edit(completeMessage);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
