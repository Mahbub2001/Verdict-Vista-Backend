"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("@/models/User"));
const validation_1 = require("@/middleware/validation");
const router = express_1.default.Router();
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};
router.post('/register', validation_1.validateRegister, async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            const response = {
                success: false,
                error: 'User already exists with this email'
            };
            res.status(400).json(response);
            return;
        }
        const user = new User_1.default({
            name,
            email,
            password
        });
        await user.save();
        const token = generateToken(user._id.toString());
        const response = {
            success: true,
            data: {
                token,
                user: user.toJSON()
            },
            message: 'User registered successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        next(error);
    }
});
router.post('/login', validation_1.validateLogin, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            const response = {
                success: false,
                error: 'Invalid credentials'
            };
            res.status(401).json(response);
            return;
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            const response = {
                success: false,
                error: 'Invalid credentials'
            };
            res.status(401).json(response);
            return;
        }
        const token = generateToken(user._id.toString());
        const response = {
            success: true,
            data: {
                token,
                user: user.toJSON()
            },
            message: 'Login successful'
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.post('/firebase-sync', async (req, res, next) => {
    try {
        const { uid, name, email, avatarUrl, idToken } = req.body;
        if (!uid || !email || !idToken) {
            const response = {
                success: false,
                error: 'Missing required fields: uid, email, idToken'
            };
            res.status(400).json(response);
            return;
        }
        if (!idToken.startsWith('eyJ')) {
            const response = {
                success: false,
                error: 'Invalid Firebase token format'
            };
            res.status(401).json(response);
            return;
        }
        let user = await User_1.default.findOne({ email });
        if (!user) {
            user = new User_1.default({
                name: name || 'User',
                email,
                avatarUrl: avatarUrl || 'https://placehold.co/100x100.png',
                firebaseUid: uid,
                debatesParticipated: 0,
                totalVotes: 0
            });
            await user.save();
        }
        else {
            user.name = name || user.name;
            user.avatarUrl = avatarUrl || user.avatarUrl;
            user.firebaseUid = uid;
            await user.save();
        }
        const userData = user.toObject();
        if ('password' in userData) {
            delete userData.password;
        }
        if ('__v' in userData) {
            delete userData.__v;
        }
        const response = {
            success: true,
            data: userData,
            message: 'User synced successfully'
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map