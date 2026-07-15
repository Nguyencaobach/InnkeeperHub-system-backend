import express from 'express';
import revenueController from './revenue.controller.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';

const router = express.Router();

// Tất cả các route doanh thu đều yêu cầu đăng nhập và phân quyền (vd: ADMIN hoặc INNKEEPER)
router.use(verifyToken);
// Tuỳ hệ thống của bạn có phân quyền cụ thể hay không, ở đây dùng chung verifyRole nếu cần
// router.use(verifyRole(['ADMIN', 'INNKEEPER']));

router.get('/summary', revenueController.getSummary);
router.get('/timeline', revenueController.getRevenueTimeline);
router.get('/payment-methods', revenueController.getPaymentMethodsDist);
router.get('/top-rooms', revenueController.getTopRooms);

export default router;
