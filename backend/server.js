import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import chatRoutes from './routes/chat.js';
import imageRoutes from './routes/image.js';
import blenderRoutes from './routes/blender.js';
import userRoutes from './routes/user.js';

const app = express();

// 🔌 Connect DB
await connectDB();

// 🛡️ Middlewares
app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://realmind-2.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked"));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 60,
}));

// 📦 Routes
app.use('/api/chat', chatRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/blender', blenderRoutes);
app.use('/api/user', userRoutes);

// ❤️ Health check
app.get('/api/health', (_, res) => {
  return res.json({ status: 'ok' });
});

// ❌ 404 handler (important)
app.use((req, res) => {
  return res.status(404).json({ error: 'Route not found' });
});

// 🚨 Error handler (FIXED)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // 🔥 Prevent double response crash
  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || 500).json({
    error: err.message || 'Server error',
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`RealMind API → http://localhost:${PORT}`);
});

console.log("GROQ KEY:", process.env.GROQ_API_KEY);