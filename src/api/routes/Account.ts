/* eslint-disable consistent-return */
import { Server } from '..';
import { Route } from '../../class';

export default class Account extends Route {
  constructor(server: Server) {
    super(server, { path: '/account', deprecated: false });
  }

  public async bind() {
    this.router.use(async (req, res, next) => {
      const url = new URL(req.url);
      const account = await this.server.client.db.Account.findOne({ username: url.username });
      if (!account) return res.status(401).json({ code: this.constants.codes.ACCOUNT_NOT_FOUND, message: 'UNAUTHORIZED' });
      // eslint-disable-next-line no-underscore-dangle
      const authResult = await this.server.security.checkBearer(account._id, this.server.security.extractBearer(req));
      if (!authResult) return res.status(401).json({ code: this.constants.codes.UNAUTHORIZED, message: 'UNAUTHORIZED' });
      next();
    });
  }
}
