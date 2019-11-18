import os from 'os';
import { Server } from '..';
import { Route } from '../../class';

export default class Root extends Route {
  constructor(server: Server) {
    super(server, { path: '/', deprecated: false });
  }

  public bind() {
    this.router.get('/', async (req, res) => {
      try {
        const date = new Date();
        date.setSeconds(-process.uptime());
        const accounts = await this.server.client.db.Account.find();
        const administrators = accounts.filter((account) => account.root === true).length;
        const response = {
          nodeVersion: process.version,
          uptime: process.uptime(),
          server: {
            users: accounts.length,
            administrators,
          },
          stats: {
            uptime: os.uptime(),
            loadAverage: os.loadavg(),
            cpuModel: os.cpus()[0].model,
            cpuClock: os.cpus()[0].speed / 1000,
            cpuCores: os.cpus().length,
            hostname: os.hostname(),
            ipv4: os.networkInterfaces().eth0.filter((r) => r.family === 'IPv4')[0].address,
            ipv6: os.networkInterfaces().eth0.filter((r) => r.family === 'IPv6')[0].address,
          },
        };
        res.status(200).json({ code: this.constants.codes.SUCCESS, message: response });
      } catch (error) {
        this.handleError(error, res);
      }
    });
  }
}
