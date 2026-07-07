import express from 'express';
import serviceOrderController from './service-order.controller.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { withCache } from '../../../../shared/middlewares/cache.middleware.js';

const router = express.Router();

// ── Static routes (phải đứng TRƯỚC dynamic :bookingId) ───────────────────────

// [GET] Admin lấy tất cả đơn chờ duyệt — Cache 30 giây
router.get(
    '/pending',
    verifyToken,
    withCache('service-orders:pending', 30),
    serviceOrderController.getAllPendingOrders.bind(serviceOrderController)
);

// [POST] Khách tạo đơn đặt dịch vụ — Bắt buộc ĐĂNG NHẬP (customer token)
router.post(
    '/',
    verifyToken,
    serviceOrderController.createOrder.bind(serviceOrderController)
);

// [PATCH] Admin xác nhận đơn
router.patch(
    '/:id/confirm',
    verifyToken,
    serviceOrderController.confirmOrder.bind(serviceOrderController)
);

// [DELETE] Admin hủy đơn
router.delete(
    '/:id',
    verifyToken,
    serviceOrderController.cancelOrder.bind(serviceOrderController)
);

// ── Dynamic routes ───────────────────────────────────────────────────────────

// [GET] Khách xem đơn của mình theo booking — Bắt buộc ĐĂNG NHẬP
router.get(
    '/:bookingId',
    verifyToken,
    serviceOrderController.getMyOrders.bind(serviceOrderController)
);

export default router;
