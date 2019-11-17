/* eslint-disable consistent-return */
import { Server } from '..';
import { Route } from '../../class';
import { Req } from '../interfaces';

export default class FileSystem extends Route {
  constructor(server: Server) {
    super(server, { path: '/fs', deprecated: false, maintenance: true });
  }

  public bind() {
    this.router.use(async (req, res, next) => {
      await this.authorize(req, res, next);
    });

    this.router.get('/:');
  }
}
