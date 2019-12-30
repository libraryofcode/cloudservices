import { writeFile } from 'fs-extra';
import axios from 'axios';
import { Message } from 'eris';
import { Command } from '../class';
import { Client } from '..';

export default class CWG_UpdateCert extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'updatecert';
    this.description = 'Update a CWG certificate';
    this.usage = `${this.client.config.prefix}cwg updatecert [Domain | Port] [Cert Chain] [Private Key] || Use snippets raw URL`;
    this.permissions = { roles: ['525441307037007902'] };
    this.aliases = ['update', 'updatecrt', 'renew', 'renewcert', 'renewcrt'];
    this.enabled = true;
  }

  public async run(message: Message, args: string[]) {
    try {
      if (!args[2]) return this.client.commands.get('help').run(message, ['cwg', this.name]);
      const dom = await this.client.db.Domain.findOne({ $or: [{ domain: args[0] }, { port: Number(args[0]) || '' }] });
      if (!dom) return message.channel.createMessage(`***${this.client.stores.emojis.error} The domain or port you provided could not be found.***`);
      const { domain, port, x509 } = dom;
      const { cert, key } = x509;

      const urls = args.slice(1, 3); // eslint-disable-line
      if (urls.some((l) => !l.includes('snippets.cloud.libraryofcode.org/raw/'))) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Invalid snippets URL***`);
      const tasks = urls.map((l) => axios({ method: 'GET', url: l }));
      const response = await Promise.all(tasks);
      const certAndPrivateKey: string[] = response.map((r) => r.data);

      if (!this.isValidCertificateChain(certAndPrivateKey[0])) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Invalid Certificate Chain***`);
      if (!this.isValidPrivateKey(certAndPrivateKey[1])) return message.channel.createMessage(`${this.client.stores.emojis.error} ***Invalid Private Key***`);

      const writeTasks = [writeFile(cert, certAndPrivateKey[0], { encoding: 'utf8' }), writeFile(key, certAndPrivateKey[1], { encoding: 'utf8' })];
      await Promise.all(writeTasks);

      return message.channel.createMessage(`${this.client.stores.emojis.success} ***Updated certificate certificate for ${domain} on port ${port}`);
    } catch (error) {
      return this.client.util.handleError(error, message, this);
    }
  }

  public checkOccurance(text: string, query: string) {
    return (text.match(new RegExp(query, 'g')) || []).length;
  }

  public isValidCertificateChain(cert: string) {
    if (!cert.replace(/^\s+|\s+$/g, '').startsWith('-----BEGIN CERTIFICATE-----')) return false;
    if (!cert.replace(/^\s+|\s+$/g, '').endsWith('-----END CERTIFICATE-----')) return false;
    if (this.checkOccurance(cert.replace(/^\s+|\s+$/g, ''), '-----BEGIN CERTIFICATE-----') !== 2) return false;
    if (this.checkOccurance(cert.replace(/^\s+|\s+$/g, ''), '-----END CERTIFICATE-----') !== 2) return false;
    return true;
  }

  public isValidPrivateKey(key: string) {
    if (!key.replace(/^\s+|\s+$/g, '').startsWith('-----BEGIN PRIVATE KEY-----')) return false;
    if (!key.replace(/^\s+|\s+$/g, '').endsWith('-----END PRIVATE KEY-----')) return false;
    if (this.checkOccurance(key.replace(/^\s+|\s+$/g, ''), '-----BEGIN PRIVATE KEY-----') !== 1) return false;
    if (this.checkOccurance(key.replace(/^\s+|\s+$/g, ''), '-----END PRIVATE KEY-----') !== 1) return false;
    return true;
  }
}
