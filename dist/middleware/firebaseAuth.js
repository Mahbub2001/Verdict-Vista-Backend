"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalFirebaseAuth = exports.verifyFirebaseToken = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const User_1 = __importDefault(require("@/models/User"));
if (!firebase_admin_1.default.apps.length) {
    try {
        const firebaseConfig = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (firebaseConfig) {
            const serviceAccount = JSON.parse(firebaseConfig);
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
            });
            console.log('Firebase Admin SDK initialized with service account');
        }
        else if (process.env.NODE_ENV === 'development') {
            console.log('Firebase Admin SDK initialization skipped for development - using mock verification');
        }
        else {
            throw new Error('Firebase service account configuration not found');
        }
    }
    catch (error) {
        console.error('Firebase Admin initialization failed:', error);
        if (process.env.NODE_ENV !== 'development') {
            throw error;
        }
    }
}
const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const response = {
                success: false,
                error: 'No token provided'
            };
            res.status(401).json(response);
            return;
        }
        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            if (firebase_admin_1.default.apps.length > 0) {
                decodedToken = await firebase_admin_1.default.auth().verifyIdToken(idToken);
                console.log('Token verified with Firebase Admin SDK');
            }
            else {
                console.log('Using development token verification (not secure for production)');
                if (!idToken || idToken === 'null' || idToken === 'undefined') {
                    throw new Error('Invalid token provided');
                }
                if (!idToken.includes('.') || idToken.split('.').length !== 3) {
                    throw new Error('Invalid JWT format');
                }
                const base64Payload = idToken.split('.')[1];
                const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
                decodedToken = {
                    uid: payload.user_id || payload.uid,
                    email: payload.email,
                    email_verified: payload.email_verified || false
                };
                if (!decodedToken.uid || !decodedToken.email) {
                    throw new Error('Missing required fields in token');
                }
            }
        }
        catch (error) {
            console.error('Token verification failed:', error);
            const response = {
                success: false,
                error: 'Invalid or expired token'
            };
            res.status(401).json(response);
            return;
        }
        const mongoUser = await User_1.default.findOne({
            $or: [
                { firebaseUid: decodedToken.uid },
                { email: decodedToken.email }
            ]
        });
        if (!mongoUser) {
            console.log('User not found in database:', { uid: decodedToken.uid, email: decodedToken.email });
            const response = {
                success: false,
                error: 'User not found in database. Please refresh the page to sync your account.'
            };
            res.status(401).json(response);
            return;
        }
        console.log('User authenticated successfully:', mongoUser.email);
        req.user = {
            _id: mongoUser._id.toString(),
            uid: decodedToken.uid,
            email: mongoUser.email,
            name: mongoUser.name
        };
        next();
    }
    catch (error) {
        console.error('Token verification error:', error);
        const response = {
            success: false,
            error: 'Token verification failed'
        };
        res.status(401).json(response);
    }
};
exports.verifyFirebaseToken = verifyFirebaseToken;
const optionalFirebaseAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const idToken = authHeader.split('Bearer ')[1];
            if (idToken && idToken !== 'null' && idToken !== 'undefined') {
                try {
                    let decodedToken;
                    if (firebase_admin_1.default.apps.length > 0) {
                        decodedToken = await firebase_admin_1.default.auth().verifyIdToken(idToken);
                    }
                    else {
                        if (idToken.includes('.') && idToken.split('.').length === 3) {
                            const base64Payload = idToken.split('.')[1];
                            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
                            decodedToken = {
                                uid: payload.user_id || payload.uid,
                                email: payload.email
                            };
                        }
                    }
                    if (decodedToken && decodedToken.uid && decodedToken.email) {
                        const mongoUser = await User_1.default.findOne({
                            $or: [
                                { firebaseUid: decodedToken.uid },
                                { email: decodedToken.email }
                            ]
                        });
                        if (mongoUser) {
                            req.user = {
                                _id: mongoUser._id.toString(),
                                uid: decodedToken.uid,
                                email: mongoUser.email,
                                name: mongoUser.name
                            };
                        }
                    }
                }
                catch (error) {
                    console.log('Optional auth failed, continuing without user:', error instanceof Error ? error.message : 'Unknown error');
                }
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalFirebaseAuth = optionalFirebaseAuth;
//# sourceMappingURL=firebaseAuth.js.map