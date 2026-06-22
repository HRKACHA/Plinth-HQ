import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import ownerRoutes from './routes/owner.js';
import notificationRoutes from './routes/notifications.js';
import vendorRoutes from './routes/vendors.js';
import materialRoutes from './routes/materials.js';
import equipmentRoutes from './routes/equipment.js';
import uploadRoutes from './routes/uploads.js';
import plinthaiRoutes from './routes/plinthai.js';
import subscriptionRoutes from './routes/subscription.js';
import inviteRoutes from './routes/invite.js';
import teamRoutes from './routes/team.js';
import chatRoutes from './routes/chat.js';
import searchRoutes from './routes/search.js';
import activityRoutes from './routes/activity.js';
import { protect } from './middleware/auth.js';
import globalErrorHandler, { notFound } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'SiteLog API is running', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/owner', ownerRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/equipment', equipmentRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/plinthai', protect, plinthaiRoutes);
app.use('/api/v1/subscription', protect, subscriptionRoutes);
app.use('/api/v1/invite', inviteRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/activity', activityRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
