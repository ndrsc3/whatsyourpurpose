import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAccessToken } from './auth-jwt.js';
import type { JWTPayload } from './types.js';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>;
type MiddlewareFactory = (handler: Handler) => Handler;

function createAuthMiddleware(verifyToken: (token: string) => JWTPayload, type: string = 'user'): MiddlewareFactory {
    return (handler: Handler): Handler => {
        return async (req: VercelRequest, res: VercelResponse) => {
            console.group(`🔵 [Middleware] ${type} Authentication`);

            try {
                const authHeader = req.headers.authorization;
                if (!authHeader?.startsWith('Bearer ')) {
                    console.warn('🟡 [Middleware] No bearer token provided');
                    console.groupEnd();
                    return res.status(401).json({
                        error: `${type} authentication required`,
                    });
                }

                const token = authHeader.split(' ')[1];

                try {
                    const decoded = verifyToken(token);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (req as any)[type.toLowerCase()] = decoded;

                    console.debug(`🔵 [Middleware] ${type} verified:`, decoded.username);
                    console.groupEnd();

                    return handler(req, res);
                } catch (error) {
                    if ((error as Error).message === 'Token expired') {
                        console.warn(`🟡 [Middleware] ${type} token expired`);
                        console.groupEnd();
                        return res.status(401).json({
                            error: 'Token expired',
                            code: 'TOKEN_EXPIRED',
                        });
                    }

                    console.error(`🔴 [Middleware] ${type} token verification failed:`, error);
                    console.groupEnd();
                    return res.status(401).json({ error: `Invalid ${type} token` });
                }
            } catch (error) {
                console.error(`🔴 [Middleware] ${type} authentication error:`, error);
                console.groupEnd();
                return res.status(500).json({ error: 'Authentication failed' });
            }
        };
    };
}

export const verifyUserToken = createAuthMiddleware(verifyAccessToken, 'user');

export function requirePermission(permission: string) {
    return (req: VercelRequest, res: VercelResponse, next: () => void) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(req as any).admin?.permissions?.includes(permission)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: permission,
            });
        }
        return next();
    };
}
