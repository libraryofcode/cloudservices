import fs from 'fs-extra';
import { parseCert } from '@ghaiklor/x509';
import { Message } from 'eris';
import { Client } from '..';
import { Command, RichEmbed } from '../class';

export default class Parse extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'parse';
    this.description = 'Gets information on a user\'s x509 certificate.';
    this.usage = `${this.client.config.prefix}parse [username || user ID]`;
    this.permissions = { roles: ['446104438969466890'] };
  }

  public async run(message: Message, args: string[]) { // eslint-disable-line
    try {
      if (!args.length) return this.client.commands.get('help').run(message, [this.name]);
      const account = await this.client.db.Account.findOne({ $or: [{ username: args[0] }, { userID: args[0].replace(/[<@!>]/gi, '') }] });
      if (!account) return message.channel.createMessage(`***${this.client.stores.emojis.error} Cannot find user.***`);
      let dir: string[];
      try {
        dir = await fs.readdir(`${account.homepath}/Validation`);
      } catch (err) {
        return message.channel.createMessage(`***${this.client.stores.emojis.error} Cannot locate Validation directory.***`);
      }
      if (!dir.length) return message.channel.createMessage(`***${this.client.stores.emojis.error} Cannot locate certificate.***`);
      const cert = parseCert(`${account.homepath}/Validation/${dir[0]}`);
      const subjectCommonName = cert.subject.commonName ? cert.subject.commonName : 'Not Specified';
      const subjectEmailAddress = cert.subject.emailAddress ? cert.subject.emailAddress : 'Not Specified';
      const subjectOrganization = cert.subject.organizationName ? cert.subject.organizationName : 'Not Specified';
      const subjectOrganizationalUnit = cert.subject.organizationalUnitName ? cert.subject.organizationalUnitName : 'Not Specified';
      const subjectCountry = cert.subject.countryName ? cert.subject.countryName : 'Not Specified';
      const issuerCommonName = cert.issuer.commonName ? cert.issuer.commonName : 'Not Specified';
      const issuerEmailAddress = cert.issuer.emailAddress ? cert.issuer.emailAddress : 'Not Specified';
      const issuerOrganization = cert.issuer.organizationName ? cert.issuer.organizationName : 'Not Specified';
      const issuerOrganizationalUnit = cert.issuer.organizationalUnitName ? cert.issuer.organizationalUnitName : 'Not Specified';
      const issuerCountry = cert.issuer.countryName ? cert.issuer.countryName : 'Not Specified';
      const user = this.client.users.get(account.userID) ? this.client.users.get(account.userID) : await this.client.getRESTUser(account.userID);
      const embed = new RichEmbed();
      embed.setTitle('Parse x509 Certificate');
      embed.setDescription(`${account.homepath}/Validation/${dir[0]} | ${account.username} <@${user.id}>`);
      embed.setColor(3447003);
      embed.addField('Subject', `**Common Name:** ${subjectCommonName}\n**Email Address:** ${subjectEmailAddress}\n**Organization:** ${subjectOrganization}\n**Organizational Unit:** ${subjectOrganizationalUnit}\n**Country:** ${subjectCountry}`, true);
      embed.addField('Issuer', `**Common Name:** ${issuerCommonName}\n**Email Address:** ${issuerEmailAddress}\n**Organization:** ${issuerOrganization}\n**Organizational Unit:** ${issuerOrganizationalUnit}\n**Country:** ${issuerCountry}`, true);
      embed.addField('Serial Number', cert.serial, true);
      embed.addField('Fingerprint', cert.fingerPrint, true);
      embed.addField('Signature Algorithm', cert.signatureAlgorithm, true);
      embed.addField('Public Key Algorithm', cert.publicKey.algorithm, true);
      embed.addField('Key Usage', cert.extensions.keyUsage, true);
      embed.addField('Extended Key Usage', cert.extensions.extendedKeyUsage, true);
      embed.addField('Policies', cert.extensions.certificatePolicies, true);
      embed.addField('Issued On', new Date(cert.notBefore).toLocaleString('en-us'), true);
      embed.addField('Expires On', new Date(cert.notAfter).toLocaleString('en-us'), true);
      embed.setFooter(this.client.user.username, this.client.user.avatarURL);
      embed.setTimestamp();
      // @ts-ignore
      message.channel.createMessage({ embed });
    } catch (error) {
      await this.client.util.handleError(error, message, this);
    }
  }
}
