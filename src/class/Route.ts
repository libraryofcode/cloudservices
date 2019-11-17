/* eslint-disable consistent-return */
import { Request, Response, NextFunction, Router as router } from 'express';
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

  public deprecated() {
    this.router.all('*', (_req, res) => {
      res.status(501).json({ code: this.constants.codes.DEPRECATED, message: 'This endpoint is deprecated.' });
    });
  }

  public async authorize(req: Request, res: Response, next: NextFunction) {
    const account = await this.server.security.checkBearer(this.server.security.extractBearer(req));
    if (!account) return res.status(401).json({ code: this.constants.codes.UNAUTHORIZED, message: 'BEARER_TOKEN_INVALID' });
    Object.defineProperty(req, 'account', { value: account, writable: true, enumerable: true, configurable: true });
    next();
  }

  public handleError(error: Error, res: Response) {
    this.server.client.util.handleError(error);
    res.status(500).json({ code: this.constants.codes.SERVER_ERROR, message: 'An internal error has occurred, Engineers have been notified.' });
  }

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
        DEPRECATED: 1051,
      },
    };
  }
}
