import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';
import routes from './routes/index.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy', data: null, meta: null });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
