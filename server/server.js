import { app } from './app.js';
import { connectDB } from './config/db.js';
const port = Number(process.env.PORT || 5000);
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host, () => console.log(`Express ready at http://${host}:${port}`));
server.requestTimeout = 150000;
server.headersTimeout = 15000;
connectDB();
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
