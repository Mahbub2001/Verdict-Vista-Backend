import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import connectDB from '@/config/database';
import { errorHandler, notFound } from '@/middleware/errorHandler';

// --------------------------routes------------------------
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import debateRoutes from '@/routes/debates';
import argumentRoutes from '@/routes/arguments';

dotenv.config();

const app = express();

connectDB();

app.use(helmet());

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:9002',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, 
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100),
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/debates', debateRoutes);
app.use('/api', argumentRoutes);

app.use(notFound);

app.use(errorHandler);

export default app;
