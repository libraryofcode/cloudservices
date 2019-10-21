import Eris from 'eris';
import mongoose from 'mongoose';
import signale from 'signale';
import fs from 'fs-extra';
import path from 'path';
import { config, Util } from '.';
import { Account, AccountInterface, Moderation, ModerationInterface, Domain, DomainInterface } from './models';
import { emojis } from './stores';
import { Command } from './class';


export default class Client extends Eris.Client {
  public config: { 'token': string; 'cloudflare': string; 'prefix': string; 'emailPass': string; };

  public util: Util;

  public commands: Map<string, Command>;

  public aliases: Map<string, string>;

  public db: { Account: mongoose.Model<AccountInterface>; Domain: mongoose.Model<DomainInterface>; Moderation: mongoose.Model<ModerationInterface>; };

  public stores: { emojis: { success: string, loading: string, error: string }; };

  public signale: signale.Signale;

  constructor() {
    super(config.token, { getAllUsers: true, restMode: true, defaultImageFormat: 'png' });

    this.config = config;
    this.util = new Util(this);
    this.commands = new Map();
    this.aliases = new Map();
    this.db = { Account, Domain, Moderation };
    this.stores = { emojis };
    this.signale = signale;
    this.signale.config({
      displayDate: true,
      displayTimestamp: true,
      displayFilename: true,
    });
  }

  public loadCommand(commandPath: string) {
    // eslint-disable-next-line no-useless-catch
    try {
      const command = new (require(commandPath))(this);
      this.commands.set(command.name, command);
      this.signale.complete(`Loaded command ${command.name}`);
    } catch (err) { throw err; }
  }

  public async init() {
    const evtFiles = await fs.readdir('./events/');
    const commands = await fs.readdir(path.join(__dirname, './commands/'));
    commands.forEach((command) => {
      this.loadCommand(`./commands/${command}`);
    });

    evtFiles.forEach((file) => {
      const eventName = file.split('.')[0];
      const event = new (require(`./events/${file}`))(this);
      this.signale.complete(`Loaded event ${eventName}`);
      this.on(eventName, (...args) => event.run(...args));
      delete require.cache[require.resolve(`./events/${file}`)];
    });

    this.connect();
  }
}
