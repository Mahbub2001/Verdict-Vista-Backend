"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV === 'development') {
    process.setMaxListeners(20);
}
const server = app_1.default.listen(PORT, () => {
    console.log(`
🚀 Server is running on port ${PORT}
📦 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:9002'}
⚡ Ready to accept connections!
  `);
});
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    await (0, database_1.disconnectDB)();
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
    setTimeout(() => {
        console.log('⚠️ Forcefully shutting down');
        process.exit(1);
    }, 10000);
};
process.removeAllListeners('SIGTERM');
process.removeAllListeners('SIGINT');
process.removeAllListeners('unhandledRejection');
process.removeAllListeners('uncaughtException');
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err, promise) => {
    console.log('Unhandled Promise Rejection:', err.message);
    gracefulShutdown('Unhandled Promise Rejection');
});
process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err.message);
    console.log('Shutting down the server due to uncaught exception');
    process.exit(1);
});
exports.default = server;
//# sourceMappingURL=server.js.map