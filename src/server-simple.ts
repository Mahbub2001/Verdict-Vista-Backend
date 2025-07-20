import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:9002',
  credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    data: {
      server: 'Express.js',
      database: 'MongoDB (Ready)',
      authentication: 'JWT (Ready)'
    }
  });
});

app.listen(PORT, () => {
  console.log(`
🚀 Backend Server is running!
📦 Port: ${PORT}
🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:9002'}
⚡ Ready to accept connections!

Test the server:
- Health check: http://localhost:${PORT}/health
- API test: http://localhost:${PORT}/api/test
  `);
});

export default app;
