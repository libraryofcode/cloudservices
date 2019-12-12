import { Message, PrivateChannel } from 'eris';
import uuid from 'uuid/v4';
import { Client } from '..';
import { Command, RichEmbed } from '../class';

export default class CreateAccount extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'createaccount';
    this.description = 'Create an account on the Cloud VM';
    this.usage = `${this.client.config.prefix}createaccount [User ID] [Email] [Account name]`;
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
      const acctName = this.client.users.get(args[0]).username.replace(/[!@#$%^&*(),.?":{}|<>]/g, '-').replace(/\s/g, '-');
      const etcPasswd = `${acctName},${args[0]},,`;

      await this.client.util.createAccount(passHash, etcPasswd, args[2], args[0], args[1], message.author.id);
      await this.client.util.createModerationLog(args[0], message.member, 0);
      /*
      const log = await new this.client.db.Moderation({
        username: args[2], userID: args[0], logID: uuid(), moderatorID: message.author.id, reason: 'User requested account creation', type: 0, date: new Date(),
      });
      await log.save();

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
      */

      this.client.util.transport.sendMail({
        to: args[1],
        from: 'Library of Code sp-us | Cloud Services <support@libraryofcode.org>',
        subject: 'Your account has been created',
        html: `
        <body>
          <style>* {font-family: 'Calibri';}</style>
          <h1>Library of Code | Cloud Services</h1>
          <h2>Your Cloud Account has been created, welcome! Please see below for some details regarding your account and our services</h2>
          <p><b>Username:</b> ${args[2]}</p>
          <p><b>SSH Login:</b> <pre><code style="font-family: Courier;">ssh ${args[2]}@cloud.libraryofcode.org</code></pre>
          <p><b>Email address (see below for further information):</b> ${args[2]}@cloud.libraryofcode.org</p>
          <h2>Useful information</h2>
          <h3>How to log in:</h3>
          <ol>
            <li>Open your desired terminal application - we recommend using <a target="_blank" href="https://git-scm.com/downloads">Bash</a>, but you can use your computer's default</li>
            <li>Type in your SSH Login as above</li>
            <li>When prompted, enter your password <em>Please note that inputs will be blank, so be careful not to type in your password incorrectly</em></li>
          </ol>
          <p>If you fail to authenticate yourself too many times, you will be IP banned and will fail to connect. If this is the case, feel free to DM Ramirez with your <a target="_blank" href="https://whatismyip.com">public IPv4 address</a>.
  
          <h3>Setting up your cloud email</h3>
          <p>All email applications are different, so here are some information you can use to connect your email</p>
          <ul>
            <li><b>Server:</b> cloud.libraryofcode.org</li>
            <li><b>Account username/password:</b> Normal login</li>
            <li><b>Account type (incoming):</b> IMAP</li>
            <li><b>Incoming port:</b> 143 (993 if you're using TLS security type)</li>
            <li><b>Incoming Security Type:</b> STARTTLS (TLS if you're using port 993)</li>
            <li><b>Outgoing port:</b> 587 (If that doesn't work, try 25)</li>
            <li><b>Outgoing Security Type:</b> STARTTLS</li>
          </ul>
          <h3>Channels and Links</h3>
          <ul>
            <li><a target="_blank" href="https://discordapp.com/channels/446067825673633794/622856541325885453">#status</a> - You can find the status of all our services, including the cloud machine, here</li>
            <li><a target="_blank" href="https://discordapp.com/channels/446067825673633794/620355063088414769">#cloud-announcements</a> - Announcements regarding the cloud machine will be here. These include planned maintenance, updates to preinstalled services etc.</li>
            <li><a target="_blank" href="https://discordapp.com/channels/446067825673633794/620349128295186472">#cloud-info</a> - Important information you will need to, or should, know to a certain extent. These include our infractions system and Tier limits</li>
            <li><a target="_blank" href="https://discordapp.com/channels/446067825673633794/546457788184789013">#cloud-support</a> - A support channel specifically for the cloud machine, you can use this to ask how to renew your certificates, for example</li>
            <li><a target="_blank" href="https://support.libraryofcode.org">Library of Code Support Desk</a> - Our Support desk, you will find some handy info there</li>
            <li><a target="_blank" href="https://wiki.cloud.libraryofcode.org">Library of Code sp-us | Cloud Wiki</a> - A wiki channel for everything related to the Cloud Services.</li>
            <li><a target="_blank" href="https://www.securesign.org">SecureSign</a> - our certificates manager</li>
          </ul>
          <h3>Want to support us?</h3>
          <p>You can support us on Patreon! Head to <a target="_blank" href="https://www.patreon.com/libraryofcode">our Patreon page</a> and feel free to donate as much or as little as you want!<br>Donating $5 or more will grant you Tier 3, which means we will manage your account at your request, longer certificates, increased Tier limits as well as some roles in the server!</p>
          <b><i>Library of Code sp-us | Support Team</i></b>
          </body>        
        `,
      });

      const dmChannel = await this.client.getDMChannel(args[0]).catch();
      dmChannel.createMessage('<:loc:607695848612167700> **Thank you for creating an account with us!** <:loc:607695848612167700>\n'
      + `Please log into your account by running \`ssh ${args[2]}@cloud.libraryofcode.org\` in your terminal, then use the password \`${tempPass}\` to log in.\n`
      + `You will be asked to change your password, \`(current) UNIX password\` is \`${tempPass}\`, then create a password that is at least 12 characters long, with at least one number, special character, and an uppercase letter\n`
      + 'Bear in mind that when you enter your password, it will be blank, so be careful not to type in your password incorrectly.\n'
      + 'You may now return to Modmail, and continue setting up your account from there.\n\n'
      + 'An email containing some useful information has also been sent').catch();

      return confirmation.edit(`${this.client.stores.emojis.success} ***Account successfully created***\n**Username:** \`${args[2]}\`\n**Temporary Password:** \`${tempPass}\``);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }
}
