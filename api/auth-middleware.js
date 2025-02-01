import { verifyAccessToken } from './auth-jwt.js';

function createAuthMiddleware(verifyToken, type = 'user') {
    return (handler) => {
        return async (req, res) => {
            console.group(`🔵 [Middleware] ${type} Authentication`);
            
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader?.startsWith('Bearer ')) {
                    console.warn('🟡 [Middleware] No bearer token provided');
                    console.groupEnd();
                    return res.status(401).json({ 
                        error: `${type} authentication required` 
                    });
                }

                const token = authHeader.split(' ')[1];

                try {
                    const decoded = verifyToken(token);
                    req[type.toLowerCase()] = decoded;
                    
                    console.debug(`🔵 [Middleware] ${type} verified:`, decoded.username);
                    console.groupEnd();
                    
                    return handler(req, res);
                } catch (error) {
                    if (error.message === 'Token expired') {
                        console.warn(`🟡 [Middleware] ${type} token expired`);
                        console.groupEnd();
                        return res.status(401).json({ 
                            error: 'Token expired',
                            code: 'TOKEN_EXPIRED'
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

// User authentication middleware
export const verifyUserToken = createAuthMiddleware(verifyAccessToken, 'user');

// Admin authentication middleware
//export const verifyAdminToken = createAuthMiddleware(verifyAdminAccessToken, 'admin');

// Admin permission middleware
export function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.admin?.permissions?.includes(permission)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: permission
            });
        }
        return next();
    };
} 