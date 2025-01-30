import { verifyAdminAccessToken } from '../../utils/adminJwt';
import { createAuthMiddleware } from './baseAuth';

export const verifyAdminToken = createAuthMiddleware(verifyAdminAccessToken, 'admin');

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