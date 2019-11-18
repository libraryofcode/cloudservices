import fs from 'fs-extra';
import axios from 'axios';
import x509 from '@ghaiklor/x509';
import { Message } from 'eris';
import { AccountInterface } from '../models';
import { Command, RichEmbed } from '../class';
import { Client } from '..';

export default class CWG_Create extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'create';
    this.description = 'Bind a domain to the CWG';
    this.usage = `${this.client.config.prefix}cwg create [User ID | Username] [Domain] [Port] <Path to x509 cert> <Path to x509 key>`;
    this.permissions = { roles: ['525441307037007902'] };
    this.aliases = ['bind'];
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    /*
    args[0] should be the user's ID OR account username; required
    args[1] should be the domain; required
    args[2] should be the port; required
    args[3] should be the path to the x509 certificate; not required
    args[4] should be the path to the x509 key; not required
    */
    try {
      if (!args[2]) return this.client.commands.get('help').run(message, ['cwg', this.name]);
      const edit = await message.channel.createMessage(`***${this.client.stores.emojis.loading} Binding domain...***`);
      const account = await this.client.db.Account.findOne({ $or: [{ username: args[0] }, { userID: args[0] }] });
      if (!account) return edit.edit(`${this.client.stores.emojis.error} Cannot locate account, please try again.`);
      if (args[3] && !args[4]) return edit.edit(`${this.client.stores.emojis.error} x509 Certificate key required`);
      let certs: { cert?: string, key?: string }; if (args[4]) certs = { cert: args[3], key: args[4] };
      if (await this.client.db.Domain.exists({ domain: args[1] })) return edit.edit(`***${this.client.stores.emojis.error} This domain already exists.***`);
      if (await this.client.db.Domain.exists({ port: Number(args[2]) })) {
        // await edit.edit(`***${this.client.stores.emojis.error} This port is already binded to a domain. Do you wish to continue? (y/n)***`);
        let answer: Message;
        try {
          answer = await this.client.util.messageCollector(message,
            `***${this.client.stores.emojis.error} This port is already binded to a domain. Do you wish to continue? (y/n)***`,
            30000, true, ['y', 'n'], (msg) => msg.author.id === message.author.id && msg.channel.id === message.channel.id);
        } catch (error) {
          return edit.edit(`***${this.client.stores.emojis.error} Bind request cancelled***`);
        }
        if (answer.content === 'n') return edit.edit(`***${this.client.stores.emojis.error} Bind request cancelled***`);
      }
      const domain = await this.createDomain(account, args[1], Number(args[2]), certs);
      const embed = new RichEmbed();
      embed.setTitle('Domain Creation');
      embed.setColor(3066993);
      embed.addField('Account Username', account.username, true);
      embed.addField('Account ID', account.id, true);
      embed.addField('Engineer', `<@${message.author.id}>`, true);
      embed.addField('Domain', domain.domain, true);
      embed.addField('Port', String(domain.port), true);
      const cert = x509.parseCert(await fs.readFile(domain.x509.cert, { encoding: 'utf8' }));
      embed.addField('Certificate Issuer', cert.issuer.organizationName, true);
      embed.addField('Certificate Subject', cert.subject.commonName, true);
      embed.setFooter(this.client.user.username, this.client.user.avatarURL);
      embed.setTimestamp(new Date(message.timestamp));
      message.delete();
      await this.client.util.exec('systemctl reload nginx');
      edit.edit(`***${this.client.stores.emojis.success} Successfully binded ${domain.domain} to port ${domain.port} for ${account.userID}.***`);
      // @ts-ignore
      this.client.createMessage('580950455581147146', { embed });
      // @ts-ignore
      this.client.getDMChannel(account.userID).then((r) => r.createMessage({ embed }));
      await this.client.util.transport.sendMail({
        to: account.emailAddress,
        from: 'Library of Code sp-us | Support Team <support@libraryofcode.org>',
        subject: 'Your domain has been binded',
        html: `
          <h1>Library of Code sp-us | Cloud Services</h1>
          <p>Hello, this is an email informing you that a new domain under your account has been binded.
          Information is below.</p>
          <b>Domain:</b> ${domain.domain}<br>
          <b>Port:</b> ${domain.port}<br>
          <b>Certificate Issuer:</b> ${cert.issuer.organizationName}<br>
          <b>Certificate Subject:</b> ${cert.subject.commonName}<br>
          <b>Responsible Engineer:</b> ${message.author.username}#${message.author.discriminator}<br><br>

          If you have any questions about additional setup, you can reply to this email or send a message in #cloud-support in our Discord server.<br>
          
          <b><i>Library of Code sp-us | Support Team</i></b>
          `,
      });
      if (!domain.domain.includes('cloud.libraryofcode.org')) {
        const content = `__**DNS Record Setup**__\nYou recently a binded a custom domain to your Library of Code sp-us Account. You'll have to update your DNS records. We've provided the records below.\n\n\`${domain.domain} IN CNAME cloud.libraryofcode.org AUTO/500\`\nThis basically means you need to make a CNAME record with the key/host of ${domain.domain} and the value/point to cloud.libraryofcode.org. If you have any questions, don't hesitate to ask us.`;
        this.client.getDMChannel(account.userID).then((r) => r.createMessage(content));
      }
      return domain;
    } catch (err) {
      await fs.unlink(`/etc/nginx/sites-available/${args[1]}`);
      await fs.unlink(`/etc/nginx/sites-enabled/${args[1]}`);
      await this.client.db.Domain.deleteMany({ domain: args[1] });
      return this.client.util.handleError(err, message, this);
    }
  }

  /**
   * This function binds a domain to a port on the CWG.
   * @param account The account of the user.
   * @param subdomain The domain to use. `mydomain.cloud.libraryofcode.org`
   * @param port The port to use, must be between 1024 and 65535.
   * @param x509 The paths to the certificate and key files. Must be already existant.
   * @example await CWG.createDomain('mydomain.cloud.libraryofcode.org', 6781);
   */
  public async createDomain(account: AccountInterface, domain: string, port: number, x509Certificate: { cert?: string, key?: string } = { cert: '/etc/nginx/ssl/cloud-org.chain.crt', key: '/etc/nginx/ssl/cloud-org.key.pem' }) {
    try {
      if (port <= 1024 || port >= 65535) throw new RangeError(`Port range must be between 1024 and 65535, received ${port}.`);
      if (await this.client.db.Domain.exists({ domain })) throw new Error(`Domain ${domain} already exists in the database.`);
      if (!await this.client.db.Account.exists({ userID: account.userID })) throw new Error(`Cannot find account ${account.userID}.`);
      await fs.access(x509Certificate.cert, fs.constants.R_OK);
      await fs.access(x509Certificate.key, fs.constants.R_OK);
      let cfg = await fs.readFile('/var/CloudServices/dist/static/nginx.conf', { encoding: 'utf8' });
      cfg = cfg.replace(/\[DOMAIN]/g, domain);
      cfg = cfg.replace(/\[PORT]/g, String(port));
      cfg = cfg.replace(/\[CERTIFICATE]/g, x509Certificate.cert);
      cfg = cfg.replace(/\[KEY]/g, x509Certificate.key);
      await fs.writeFile(`/etc/nginx/sites-available/${domain}`, cfg, { encoding: 'utf8' });
      await fs.symlink(`/etc/nginx/sites-available/${domain}`, `/etc/nginx/sites-enabled/${domain}`);
      const entry = new this.client.db.Domain({
        account,
        domain,
        port,
        x509: x509Certificate,
        enabled: true,
      });
      if (domain.includes('cloud.libraryofcode.org')) {
        const dmn = domain.split('.');
        await axios({
          method: 'post',
          url: 'https://api.cloudflare.com/client/v4/zones/5e82fc3111ed4fbf9f58caa34f7553a7/dns_records',
          headers: { Authorization: `Bearer ${this.client.config.cloudflare}`, 'Content-Type': 'application/json' },
          data: JSON.stringify({ type: 'CNAME', name: `${dmn[0]}.${dmn[1]}`, content: 'cloud.libraryofcode.org', proxied: false }),
        });
      }
      return entry.save();
    } catch (error) {
      await fs.unlink(`/etc/nginx/sites-enabled/${domain}`);
      await fs.unlink(`/etc/nginx/sites-available/${domain}`);
      await this.client.db.Domain.deleteMany({ domain });
      throw error;
    }
  }
}
