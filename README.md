# Debate Platform Backend

A robust Node.js backend API for the AI-powered debate platform built with Express.js, MongoDB, and TypeScript.

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **Debate Management**: Create, read, update, and delete debates
- **Argument System**: Add arguments to debates with voting functionality
- **User Profiles**: User management with statistics tracking
- **Real-time Features**: Support for debate timers and live interactions
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Database**: MongoDB with Mongoose ODM
- **TypeScript**: Full TypeScript support for type safety

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Morgan

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/debate_platform
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:9002
```

5. Start MongoDB (if running locally):
```bash
mongod
```

6. Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/me` - Get current user profile (protected)
- `PUT /api/users/me` - Update current user profile (protected)
- `GET /api/users/leaderboard` - Get user leaderboard

### Debates
- `GET /api/debates` - Get all debates (with filtering and pagination)
- `GET /api/debates/:id` - Get debate by ID
- `POST /api/debates` - Create new debate (protected)
- `PUT /api/debates/:id` - Update debate (protected, creator only)
- `DELETE /api/debates/:id` - Delete debate (protected, creator only)
- `GET /api/debates/categories` - Get all debate categories

### Arguments
- `GET /api/debates/:debateId/arguments` - Get arguments for a debate
- `POST /api/debates/:debateId/arguments` - Create new argument (protected)
- `GET /api/arguments/:id` - Get argument by ID
- `PUT /api/arguments/:id` - Update argument (protected, author only)
- `DELETE /api/arguments/:id` - Delete argument (protected, author only)
- `POST /api/arguments/:id/vote` - Vote/unvote on argument (protected)

## Database Schema

### User Schema
```typescript
{
  name: string;
  email: string;
  password: string;
  avatarUrl: string;
  debatesParticipated: number;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Debate Schema
```typescript
{
  title: string;
  description: string;
  tags: string[];
  category: string;
  imageUrl: string;
  creatorId: ObjectId;
  duration: number;
  endTime: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Argument Schema
```typescript
{
  debateId: ObjectId;
  authorId: ObjectId;
  side: 'support' | 'oppose';
  text: string;
  votes: number;
  votedBy: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Rate Limiting**: Prevents API abuse
- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers
- **Input Validation**: express-validator for request validation
- **MongoDB Injection Protection**: Mongoose built-in protection

## Development

### Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

### Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── types/           # TypeScript type definitions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## Error Handling

The API uses a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "data": [] 
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
