import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes';
import courseRoutes from './routes/courseRoutes';
import lessonRoutes from './routes/lessonRoutes';
import noticeRoutes from './routes/noticeRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import videoStreamRoutes from './routes/videoStreamRoutes';
import paymentRoutes from './routes/paymentRoutes';
import userRoutes from './routes/userRoutes';
import courseContentRoutes from './routes/courseContentRoutes';
import publicCourseRoutes from './routes/publicCourseRoutes';
import categoryRoutes from './routes/categoryRoutes';
import tagRoutes from './routes/tagRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import blogRoutes from './routes/blogRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
import aiChatRoutes from './routes/aiChatRoutes';
import quizRoutes from './routes/quizRoutes';
// Cloudflare routes removed - using Bunny CDN for all media
import paypalRoutes from './routes/paypalRoutes';
import voucherRoutes from './routes/voucherRoutes';
import { errorHandler } from './middleware/errorHandler';
import courseProgressRoutes from './routes/courseProgressRoutes';

config();

export const app: Express = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create required upload directories
const createUploadDirectories = () => {
  const dirs = [
    'uploads',
    'uploads/course-content',
    'uploads/course-videos',
    'uploads/course-images',
    'uploads/course-attachments',
    'uploads/payment-receipts',
    'uploads/blogs',
    'uploads/payment-receipts',
    'uploads/question-images'
  ];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};
createUploadDirectories();

// Serve static files from uploads directory
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/courses', courseProgressRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/stream', videoStreamRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/course-content', courseContentRoutes);
app.use('/api/public/courses', publicCourseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/webhook/whatsapp', whatsappRoutes);
app.use('/api', whatsappRoutes);
app.use('/api', aiChatRoutes);
app.use('/api/quizzes', quizRoutes);
// app.use('/api/cloudflare', cloudflareRoutes); // Removed - using Bunny CDN
app.use('/api/paypal', paypalRoutes);
app.use('/api/vouchers', voucherRoutes);

// Basic route for testing
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to LMS API' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    if (!process.env.DISABLE_DB_CONNECT) {
      await connectDB();
    }
    app.listen(port, '0.0.0.0', () => {
      console.log(`⚡️[server]: Server is running at http://0.0.0.0:${port}`);
      console.log(`⚡️[server]: Accessible at http://localhost:${port}`);
      console.log(`⚡️[server]: Accessible at http://192.168.10.2:${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startServer();
