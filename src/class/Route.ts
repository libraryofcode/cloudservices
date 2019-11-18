/* eslint-disable consistent-return */
import { Request, Response, NextFunction, Router as router } from 'express';
import { Server } from '../api';

export default class Route {
  public server: Server;

  public router: router;

  public conf: { path: string, deprecated?: boolean };

  constructor(server: Server, conf: { path: string, deprecated?: boolean, maintenance?: boolean }) {
    this.server = server;
    this.router = router();
    this.conf = conf;
  }

  public bind() {}

  public deprecated(): void {
    this.router.all('*', (_req, res) => {
      res.status(501).json({ code: this.constants.codes.DEPRECATED, message: this.constants.messages.DEPRECATED });
    });
  }

  public maintenance(): void {
    this.router.all('*', (_req, res) => {
      res.status(503).json({ code: this.constants.codes.MAINTENANCE_OR_UNAVAILABLE, message: this.constants.messages.MAINTENANCE_OR_UNAVAILABLE });
    });
  }

  /**
   * This function checks for the presense of a Bearer token with Security.extractBearer(),
   * then it will attempt to validate it with Security.checkBearer().
   * If it can authenticate the request, it'll add a custom property on Request called
   * `account`, which will hold an the bearer token's account owner. The account is of the
   * type `AccountInterface`.
   * @param req The Request object from Express.
   * @param res The Response object from Express.
   * @param next The NextFunction from Express.
   * @example Security.authorize(req, res, next);
   */
  public async authorize(req: Request, res: Response, next: NextFunction) {
    const account = await this.server.security.checkBearer(this.server.security.extractBearer(req));
    if (!account) return res.status(401).json({ code: this.constants.codes.UNAUTHORIZED, message: this.constants.messages.UNAUTHORIZED });
    Object.defineProperty(req, 'account', { value: account, writable: true, enumerable: true, configurable: true });
    next();
  }

  /**
   * This function calls Util.handleError() internally, however it also sends a generic
   * response to the user.
   * @param error The Error object.
   * @param res The Response object from Express.
   */
  public handleError(error: Error, res: Response): void {
    this.server.client.util.handleError(error);
    res.status(500).json({ code: this.constants.codes.SERVER_ERROR, message: this.constants.messages.SERVER_ERROR });
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
        MAINTENANCE_OR_UNAVAILABLE: 1053,
      },
      messages: {
        UNAUTHORIZED: ['CREDENTIALS_INVALID', 'The credentials you supplied are invalid.'],
        PERMISSION_DENIED: ['PERMISSION_DENIED', 'You do not have valid credentials to access this resource.'],
        NOT_FOUND: ['NOT_FOUND', 'The resource you requested cannot be located.'],
        SERVER_ERROR: ['INTERNAL_ERROR', 'An internal error has occurred, Engineers have been notified.'],
        DEPRECATED: ['ENDPOINT_OR_RESOURCE_DEPRECATED', 'The endpoint or resource you\'re trying to access has been deprecated.'],
        MAINTENANCE_OR_UNAVAILABLE: ['SERVICE_UNAVAILABLE', 'The endpoint or resource you\'re trying to access is either in maintenance or is not available.'],
      },
    };
  }
}
