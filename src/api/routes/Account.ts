/* eslint-disable consistent-return */
import { Server } from '..';
import { Route } from '../../class';

export default class Account extends Route {
  constructor(server: Server) {
    super(server, { path: '/account', deprecated: false });
  }

  public bind() {
    this.router.use(async (req, res, next) => {
      const account = await this.server.client.db.Account.findOne({ username: req.query.username });
      if (!account) return res.status(401).json({ code: this.constants.codes.ACCOUNT_NOT_FOUND, message: 'UNAUTHORIZED' });
      // eslint-disable-next-line no-underscore-dangle
      const authResult = await this.server.security.checkBearer(account._id, this.server.security.extractBearer(req));
      if (!authResult) return res.status(401).json({ code: this.constants.codes.UNAUTHORIZED, message: 'UNAUTHORIZED' });
      next();
    });

    this.router.get('/', async (req, res) => {
      const account = await this.server.client.db.Account.findOne({ username: req.query.username });
      const acc: any = {};
      acc.username = account.username;
      acc.userID = account.userID;
      acc.email = account.emailAddress;
      acc.locked = account.locked;
      acc.root = account.root;
      acc.createdAt = account.createdAt;
      acc.createdBy = account.createdBy;
      acc.permissions = account.permissions;
      res.status(200).json({ code: this.constants.codes.SUCCESS, message: acc });
    });
  }
}
