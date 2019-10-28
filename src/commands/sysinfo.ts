import moment from 'moment';
import { Message } from 'eris';
import os, { totalmem } from 'os';
import { Command, RichEmbed } from '../class';
import { dataConversion } from '../functions';
import { Client } from '..';

export default class SysInfo extends Command {
  constructor(client: Client) {
    super(client);
    this.name = 'sysinfo';
    this.description = 'Provides system information.';
    this.enabled = true;
  }

  public async run(message: Message) {
    const availableMemory: string = await this.client.util.exec('free -b');
    const usedMemory = dataConversion(totalmem() - Number(availableMemory.split('\n')[1].split(' ').slice(-1)[0]));
    const date = new Date();
    date.setMilliseconds(-(moment.duration(os.uptime(), 's').asMilliseconds()));

    const embed = new RichEmbed();
    embed.setTitle('System Information & Statistics');
    embed.addField('Hostname', os.hostname(), true);
    embed.addField('Uptime', `${moment.duration(os.uptime(), 's').humanize()} | Last restart was on ${moment(date).format('dddd, MMMM Do YYYY, h:mm:ss A')} EST`, true);
    embed.addField('CPU', `${os.cpus()[0].model} ${os.cpus()[0].speed / 1000}GHz | ${os.cpus().length} Cores | ${os.arch()}`, true);
    embed.addField('Load Average (last 15 minutes)', os.loadavg()[2].toFixed(3), true);
    embed.addField('Memory/RAM', `${usedMemory} / ${dataConversion(totalmem())}`, true);
    embed.addField('Network Interfaces (IPv4)', os.networkInterfaces().eth0.filter((r) => r.family === 'IPv4')[0].address, true);
    embed.addField('Network Interfaces (IPv6)', os.networkInterfaces().eth0.filter((r) => r.family === 'IPv6')[0].address.replace(/:/gi, '\:'), true); // eslint-disable-line
    embed.setFooter(this.client.user.username, this.client.user.avatarURL);
    embed.setTimestamp();
    // @ts-ignore
    message.channel.createMessage({ embed });
  }
}
