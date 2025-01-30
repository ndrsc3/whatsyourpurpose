import { verifyAccessToken } from '../../utils/jwt';
import { createAuthMiddleware } from './baseAuth';

export const verifyUserToken = createAuthMiddleware(verifyAccessToken, 'user');