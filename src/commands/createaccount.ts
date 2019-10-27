import { Message, PrivateChannel } from 'eris';
import { Client, config } from '..';
import { Command, RichEmbed } from '../class';

export default class CreateAccount extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'createaccount';
    this.description = 'Create an account on the Cloud VM';
    this.usage = `${config.prefix}createaccount [User ID] [Email] [Account name]`;
    this.aliases = ['createacc', 'cacc', 'caccount', 'create'];
    this.permissions = { roles: ['475817826251440128', '525441307037007902'] };
    this.enabled = true;
  }

  /*
    args[0] is the user ID
    args[1] is the email
    args[2] is the username of the account to be created
  */

  public async run(message: Message, args: string[]) {
    try {
      if (message.channel instanceof PrivateChannel) return message; // Stop TS being gay
      if (!args[2]) return this.client.commands.get('help').run(message, [this.name]);
      if (!message.channel.guild.members.has(args[0])) return message.channel.createMessage(`${this.client.stores.emojis.error} ***User not found***`);
      if (message.channel.guild.members.get(args[0]).bot) return message.channel.createMessage(`${this.client.stores.emojis.error} ***I cannot create accounts for bots***`);
      const checkUser = await this.client.db.Account.findOne({ userID: args[0] });
      if (checkUser) return message.channel.createMessage(`${this.client.stores.emojis.error} ***<@${args[0]}> already has an account***`);
      const checkEmail = await this.client.db.Account.findOne({ emailAddress: args[1] });
      if (checkEmail) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account already exists with this email address***`);
      const checkAccount = await this.client.db.Account.findOne({ username: args[2] });
      if (checkAccount) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Account already exists with this username***`);

      if (!this.client.util.isValidEmail(args[1])) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Invalid email address supplied***`);
      if (!/^[a-z][-a-z0-9]*$/.test(args[2])) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Invalid username supplied***`);

      const confirmation = await message.channel.createMessage(`${this.client.stores.emojis.loading} ***Creating account...***`);

      const tempPass = this.client.util.randomPassword();
      let passHash = await this.client.util.createHash(tempPass); passHash = passHash.replace(/[$]/g, '\\$').replace('\n', '');
      const acctName = message.author.username.replace(/[!@#$%^&*(),.?":{}|<>]/g, '-').replace(/\s/g, '-');
      const etcPasswd = `${acctName},${args[0]},,`;

      await this.client.util.createAccount(passHash, etcPasswd, args[2], args[0], args[1], message.author.id);

      const embed = new RichEmbed();
      embed.setTitle('Cloud Account | Create');
      embed.setColor('00ff00');
      embed.addField('User', `${args[2]} | <@${args[0]}>`);
      embed.addField('Engineer', `<@${message.author.id}>`, true);
      embed.addField('Reason', 'User requested account creation');
      embed.setFooter(this.client.user.username, this.client.user.avatarURL);
      embed.setTimestamp();
      // @ts-ignore
      this.client.createMessage('580950455581147146', { embed });
      return confirmation.edit(`${this.client.stores.emojis.success} ***Account successfully created***\n**Username:** \`${args[2]}\`\n**Temporary Password:** \`${tempPass}\``);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
