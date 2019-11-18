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
      await this.authorize(req, res, next);
    });

    this.router.get('/', async (req: Req, res) => {
      try {
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
      } catch (error) {
        this.handleError(error, res);
      }
    });

    this.router.get('/moderations/:id?', async (req: Req, res) => {
      try {
        const moderations = await this.server.client.db.Moderation.find({ username: req.account.username });
        if (!moderations.length) res.sendStatus(204);
        if (req.params.id) {
          const filtered = moderations.filter((moderation) => moderation.logID === req.params.id);
          res.status(200).json({ code: this.constants.codes.SUCCESS, message: { filtered } });
        } else {
          res.status(200).json({ code: this.constants.codes.SUCCESS, message: moderations });
        }
      } catch (error) {
        this.handleError(error, res);
      }
    });

    this.router.get('/storage', async (req: Req, res) => {
      try {
        const data = await this.server.client.redis.get(`storage-${req.account.username}`) ? Number(await this.server.client.redis.get(`storage-${req.account.username}`)) : null;
        res.status(200).json({ code: this.constants.codes.SUCCESS, message: data });
      } catch (error) {
        this.handleError(error, res);
      }
    });
  }
}
