/* eslint-disable no-useless-return */
import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import fs from 'fs-extra';
import { Client } from '..';
import { Security } from '.';
import { Route } from '../class';

export default class Server {
  public routes: Map<string, Route>;

  public client: Client;

  public security: Security;

  public app: express.Express;

  public options: { port: number }

  constructor(client: Client, options?: { port: number }) {
    this.options = options;
    this.routes = new Map();
    this.client = client;
    this.security = new Security(this.client);
    this.app = express();
    this.connect();
    this.loadRoutes();
  }

  private async loadRoutes(): Promise<void> {
    const routes = await fs.readdir(`${__dirname}/routes`);
    routes.forEach(async (routeFile) => {
      if (routeFile === 'index.js') return;
      try {
        // eslint-disable-next-line new-cap
        const route = new (require(`${__dirname}/routes/${routeFile}`).default)(this);
        if (route.conf.deprecated === true) {
          route.deprecated();
        } else {
          route.bind();
        }
        this.routes.set(route.conf.path, route);
        this.app.use(route.conf.path, route.router);
        this.client.signale.success(`Successfully loaded route ${route.conf.path}`);
      } catch (error) {
        this.client.signale.error(error);
      }
    });
  }

  private connect(): void {
    this.app.set('trust proxy', 'loopback');
    this.app.use(helmet({
      hsts: false,
      hidePoweredBy: false,
      contentSecurityPolicy: true,
    }));
    this.app.use(bodyParser.json());
    this.app.listen(this.options.port, () => {
      this.client.signale.success(`API Server listening on port ${this.options.port}`);
    });
  }
}
