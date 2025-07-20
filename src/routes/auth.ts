import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { validateRegister, validateLogin } from '@/middleware/validation';
import { ApiResponse } from '@/types';

const router = express.Router();

// ----------------------------------Generate JWT token---------------------
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  } as jwt.SignOptions);
};


router.post('/register', validateRegister, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // ------------------Check  user already exists or not--------------------
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'User already exists with this email'
      };
      res.status(400).json(response);
      return;
    }

    // ----------Create user----------------
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // --------------------Generate token------------------
    const token = generateToken((user._id as any).toString());

    const response: ApiResponse = {
      success: true,
      data: {
        token,
        user: user.toJSON()
      },
      message: 'User registered successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});


router.post('/login', validateLogin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // ----------------------Check user exists or not----------------
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid credentials'
      };
      res.status(401).json(response);
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid credentials'
      };
      res.status(401).json(response);
      return;
    }

    const token = generateToken((user._id as any).toString());

    const response: ApiResponse = {
      success: true,
      data: {
        token,
        user: user.toJSON()
      },
      message: 'Login successful'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/firebase-sync', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { uid, name, email, avatarUrl, idToken } = req.body;

    if (!uid || !email || !idToken) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: uid, email, idToken'
      };
      res.status(400).json(response);
      return;
    }


    if (!idToken.startsWith('eyJ')) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid Firebase token format'
      };
      res.status(401).json(response);
      return;
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: name || 'User',
        email,
        avatarUrl: avatarUrl || 'https://placehold.co/100x100.png',
        firebaseUid: uid, 
        debatesParticipated: 0,
        totalVotes: 0
      });
      await user.save();
    } else {
      user.name = name || user.name;
      user.avatarUrl = avatarUrl || user.avatarUrl;
      user.firebaseUid = uid;
      await user.save();
    }

    const userData = user.toObject() as any;
    if ('password' in userData) {
      delete userData.password;
    }
    if ('__v' in userData) {
      delete userData.__v;
    }

    const response: ApiResponse = {
      success: true,
      data: userData,
      message: 'User synced successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
