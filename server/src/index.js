import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectDb } from './config/db.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();
const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.resolve('uploads')));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'cs-elibrary' }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Reading room API on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed.', error.message);
    process.exit(1);
  });
