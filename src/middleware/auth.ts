import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { ApiResponse } from '@/types';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. No token provided.'
      };
      res.status(401).json(response);
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid token. User not found.'
      };
      res.status(401).json(response);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid token.'
    };
    res.status(401).json(response);
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.get('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};
