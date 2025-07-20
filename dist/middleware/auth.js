"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("@/models/User"));
const authenticate = async (req, res, next) => {
    try {
        const token = req.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            const response = {
                success: false,
                error: 'Access denied. No token provided.'
            };
            res.status(401).json(response);
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.default.findById(decoded.userId);
        if (!user) {
            const response = {
                success: false,
                error: 'Invalid token. User not found.'
            };
            res.status(401).json(response);
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        const response = {
            success: false,
            error: 'Invalid token.'
        };
        res.status(401).json(response);
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.get('Authorization')?.replace('Bearer ', '');
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await User_1.default.findById(decoded.userId);
            if (user) {
                req.user = user;
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map