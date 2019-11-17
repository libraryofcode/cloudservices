/* eslint-disable consistent-return */
import { Server } from '..';
import { Route } from '../../class';
import { Req } from '../interfaces';

export default class Account extends Route {
  constructor(server: Server) {
    super(server, { path: '/account', deprecated: false });
  }

  public bind() {
    this.router.use(async (req, res, next) => {
      const account = await this.server.security.checkBearer(this.server.security.extractBearer(req));
      if (!account) return res.status(401).json({ code: this.constants.codes.UNAUTHORIZED, message: 'BEARER_TOKEN_INVALID' });
      Object.defineProperty(req, 'account', { value: account, writable: true, enumerable: true, configurable: true });
      next();
    });

    this.router.get('/', async (req: Req, res) => {
      const acc: any = {};
      acc.username = req.account.username;
      acc.userID = req.account.userID;
      acc.email = req.account.emailAddress;
      acc.locked = req.account.locked;
      acc.root = req.account.root;
      acc.createdAt = req.account.createdAt;
      acc.createdBy = req.account.createdBy;
      acc.permissions = req.account.permissions;
      res.status(200).json({ code: this.constants.codes.SUCCESS, message: acc });
    });

    this.router.get('/moderations/:id?', async (req: Req, res) => {
      const moderations = await this.server.client.db.Moderation.find({ username: req.account.username });
      if (!moderations.length) res.sendStatus(204);
      if (req.params.id) {
        const filtered = moderations.filter((moderation) => moderation.logID === req.params.id);
        res.status(200).json({ code: this.constants.codes.SUCCESS, message: { filtered } });
      } else {
        res.status(200).json({ code: this.constants.codes.SUCCESS, message: moderations });
      }
    });
  }
}
