import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = (req, res, next) => {
    // Skip authentication for these public routes
    const publicRoutes = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/forgot-password',
        '/api/auth/reset-password'
    ];

    if (publicRoutes.some(route => req.path.startsWith(route))) {
        return next();
    }

    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Authorization token required" });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user to request
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            ...(decoded.villaId && { villaId: decoded.villaId }) // Optional for staff
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired" });
        }
        
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 */
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user?.role) {
            return res.status(401).json({ message: "Unauthorized - No role assigned" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Forbidden - Requires one of these roles: ${allowedRoles.join(', ')}` 
            });
        }

        next();
    };
    
};

export { 
    authMiddleware, 
    roleMiddleware
};