import Eris from 'eris';
import mongoose from 'mongoose';
import fs from 'fs-extra';
import path from 'path';
import config from './config.json';

const options: any = {
  getAllUsers: true,
  restMode: true,
  defaultImageFormat: 'png'
}

export default class Client extends Eris.Client {
  public commands: Map<string, any>;
  public aliases: Map<string, string>;
  constructor() {
    super(config.token, options);

    this.commands = new Map();
    this.aliases = new Map();
  }

  public loadCommand(commandPath: string) {
    // eslint-disable-next-line no-useless-catch
    try {
      const command = new (require(commandPath))(this);
      this.commands.set(command.name, command)
      return `Successfully loaded ${command.name}.`;
    } catch (err) { throw err; }
  }

  public async init() {
    const evtFiles = await fs.readdir('./events/');
    
    const commands = await fs.readdir(path.join(__dirname, './commands/'));
    commands.forEach(command => {
      const response = this.loadCommand(`./commands/${command}`);
      if (response) console.log(response);
    });
    
    console.log(`Loading a total of ${evtFiles.length} events.`);
    evtFiles.forEach(file => {
      const eventName = file.split('.')[0];
      console.log(`Loading Event: ${eventName}`);
      const event = new (require(`./events/${file}`))(this);
      this.on(eventName, (...args) => event.run(...args));
      delete require.cache[require.resolve(`./events/${file}`)];
    });

    this.connect();
  }
}