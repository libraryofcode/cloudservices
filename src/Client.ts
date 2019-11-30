import Eris from 'eris';
import Redis from 'ioredis';
import mongoose from 'mongoose';
import signale from 'signale';
import fs from 'fs-extra';
import config from './config.json';
import { Server } from './api';
import { Account, AccountInterface, Moderation, ModerationInterface, Domain, DomainInterface } from './models';
import { emojis } from './stores';
import { Command, Util, Collection } from './class';
import * as commands from './commands';


export default class Client extends Eris.Client {
  public config: { 'token': string; 'cloudflare': string; 'prefix': string; 'emailPass': string; 'mongoURL': string; 'port': number; 'keyPair': { 'publicKey': string; 'privateKey': string; }; };

  public util: Util;

  public commands: Collection<Command>;

  public db: { Account: mongoose.Model<AccountInterface>; Domain: mongoose.Model<DomainInterface>; Moderation: mongoose.Model<ModerationInterface>; };

  public redis: Redis.Redis;

  public stores: { emojis: { success: string, loading: string, error: string }; };

  public signale: signale.Signale;

  public server: Server;

  public updating: Boolean;

  constructor() {
    super(config.token, { getAllUsers: true, restMode: true, defaultImageFormat: 'png' });

    process.title = 'cloudservices';
    this.config = config;
    this.util = new Util(this);
    this.commands = new Collection<Command>();
    this.db = { Account, Domain, Moderation };
    this.redis = new Redis();
    this.stores = { emojis };
    this.signale = signale;
    this.signale.config({
      displayDate: true,
      displayTimestamp: true,
      displayFilename: true,
    });
    this.updating = false;
    this.events();
    this.loadFunctions();
    this.init();
  }

  private async events() {
    process.on('unhandledRejection', (error) => {
      this.signale.error(error);
    });
  }

  private async loadFunctions() {
    const functions = await fs.readdir('./functions');
    functions.forEach(async (func) => {
      if (func === 'index.ts' || func === 'index.js') return;
      try {
        (require(`./functions/${func}`).default)(this);
      } catch (error) {
        this.signale.error(`Error occured loading ${func}`);
        await this.util.handleError(error);
      }
    });
  }

  public loadCommand(CommandFile: any) {
    // eslint-disable-next-line no-useless-catch
    try {
      // eslint-disable-next-line
      const command: Command = new CommandFile(this);
      if (command.subcmds.length) {
        command.subcmds.forEach((C) => {
          const cmd: Command = new C(this);
          command.subcommands.add(cmd.name, cmd);
        });
      }
      delete command.subcmds;
      this.commands.add(command.name, command);
      this.signale.complete(`Loaded command ${command.name}`);
    } catch (err) { throw err; }
  }

  public async init() {
    const evtFiles = await fs.readdir('./events/');
    Object.values(commands).forEach((c: Function) => this.loadCommand(c));

    evtFiles.forEach((file) => {
      const eventName = file.split('.')[0];
      if (file === 'index.js') return;
      // eslint-disable-next-line
      const event = new (require(`./events/${file}`).default)(this);
      this.signale.complete(`Loaded event ${eventName}`);
      this.on(eventName, (...args) => event.run(...args));
      delete require.cache[require.resolve(`./events/${file}`)];
    });

    await mongoose.connect(config.mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
    await this.connect();
    this.on('ready', () => {
      this.signale.info(`Connected to Discord as ${this.user.username}#${this.user.discriminator}`);
    });
    const intervals = await fs.readdir('./intervals');
    intervals.forEach((interval) => {
      // eslint-disable-next-line
      if (interval === 'index.js') return;
      require(`./intervals/${interval}`).default(this);
      this.signale.complete(`Loaded interval ${interval.split('.')[0]}`);
    });
    this.server = new Server(this, { port: this.config.port });

    const files = Object.keys(require.cache).filter((path) => path.startsWith('/var/CloudServices/dist'));
    files.forEach((file) => delete require.cache[file]);
  }
}

// eslint-disable-next-line
new Client();
