import { Router as router } from 'express';
import { Server } from '../api';

export default class Route {
  public server: Server;

  public router: router;

  public conf: { path: string, deprecated?: boolean };

  constructor(server: Server, conf: { path: string, deprecated?: boolean }) {
    this.server = server;
    this.router = router();
    this.conf = conf;
  }

  public bind() {}

  get constants() {
    return {
      codes: {
        SUCCESS: 100,
        UNAUTHORIZED: 101,
        PERMISSION_DENIED: 104,
        NOT_FOUND: 104,
        ACCOUNT_NOT_FOUND: 1041,
        CLIENT_ERROR: 1044,
        SERVER_ERROR: 105,
        UNKNOWN_SERVER_ERROR: 1051,
      },
    };
  }
}
