import express from 'express'
import cors from 'cors'
import authRoutes from './src/routes/auth.routes.js'
import { connectDB } from './src/lib/db.js'
import cookieParser from 'cookie-parser'
import bookRoutes from './src/routes/book.routes.js'
import qandqRoutes from './src/routes/qandq.routes.js'
import profileRoutes from './src/routes/profile.routes.js'
import messageRoutes from './src/routes/message.routes.js'

const app = express()
const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.1.247:5173', // Replace with your actual Windows PC local IP
  'http://localhost',
  'https://localhost',
  'capacitor://localhost'
];

app.use(cookieParser())

// Allow CORS for local PC browser, local IP, and Capacitor WebViews
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Or callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: "20mb" }));

app.use('/api/auth', authRoutes)
app.use('/api/book', bookRoutes)
app.use('/api/qandq', qandqRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/message', messageRoutes)

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
  connectDB();
});