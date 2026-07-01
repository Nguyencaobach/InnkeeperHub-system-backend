import express from 'express';
import { getAllBills, getBillById, deleteBill } from './bill_payments.controller.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { requireRole } from '../../../shared/middlewares/role.middleware.js';
import { withCache } from '../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../shared/services/cache.service.js';

const router = express.Router();

// Yêu cầu đăng nhập
router.use(verifyToken);
// Chỉ ADMIN và MANAGER xem được lịch sử hóa đơn
router.use(requireRole(['ADMIN', 'MANAGER']));

// ── Lấy danh sách hóa đơn (có hỗ trợ filter qua query) — Cache 2 phút
router.get('/', withCache('bill-payments:all', TTL.SHORT), getAllBills);

// ── Lấy chi tiết 1 hóa đơn — Cache 2 phút
router.get('/:id', withCache('bill-payments:detail', TTL.SHORT), getBillById);

// ── Xóa hóa đơn (chỉ ADMIN)
router.delete('/:id', requireRole(['ADMIN']), deleteBill);

export default router;
