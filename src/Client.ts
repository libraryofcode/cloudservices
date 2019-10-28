import Eris from 'eris';
import mongoose from 'mongoose';
import signale from 'signale';
import fs from 'fs-extra';
import path from 'path';
import { config } from '.';
import { Account, AccountInterface, Moderation, ModerationInterface, Domain, DomainInterface } from './models';
import { emojis } from './stores';
import { Command, Util } from './class';


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
    this.loadFunctions();
    this.init();
  }

  private async loadFunctions() {
    const functions = await fs.readdir('./functions');
    functions.forEach(async (func) => {
      try {
        require(`./functions/${func}`).default(this);
      } catch (error) {
        await this.util.handleError(error);
      }
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

    await mongoose.connect(config.mongoURL);
    await this.connect();
    this.signale.success(`Successfully connected to Discord | ${this.user.username}#${this.user.discriminator}`);
  }
}
