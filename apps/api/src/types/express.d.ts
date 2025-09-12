import { IronSession } from 'iron-session';
import { SessionData } from '../config/session';

declare module 'express-serve-static-core' {
  interface Request {
    session: IronSession<SessionData>;
  }
}