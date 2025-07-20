"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:9002',
    credentials: true
}));
app.use(express_1.default.json());
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
exports.default = app;
//# sourceMappingURL=server-simple.js.map