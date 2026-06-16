import express from 'express';
import { getAllBills, getBillById, deleteBill } from './bill_payments.controller.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { requireRole } from '../../../shared/middlewares/role.middleware.js';

const router = express.Router();

// Yêu cầu đăng nhập
router.use(verifyToken);
// Chỉ ADMIN và MANAGER xem được lịch sử hóa đơn
router.use(requireRole(['ADMIN', 'MANAGER']));

// ── Lấy danh sách hóa đơn (có hỗ trợ filter qua query)
router.get('/', getAllBills);

// ── Lấy chi tiết 1 hóa đơn
router.get('/:id', getBillById);

// ── Xóa hóa đơn (chỉ ADMIN)
router.delete('/:id', requireRole(['ADMIN']), deleteBill);

export default router;
