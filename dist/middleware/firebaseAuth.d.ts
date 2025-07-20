import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        uid: string;
        email: string;
        name: string;
        [key: string]: any;
    };
}
export declare const verifyFirebaseToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalFirebaseAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=firebaseAuth.d.ts.map