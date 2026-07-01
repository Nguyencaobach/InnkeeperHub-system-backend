import express from 'express';
import { getWarehouseDashboard, discardBatch } from './warehouse_status.controller.js';
import { discardBatchSchema } from './warehouse_status.validation.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { withCache } from '../../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../../shared/services/cache.service.js';

const router = express.Router();

// Bắt buộc phải đăng nhập
router.use(verifyToken);

// [GET] API Lấy toàn bộ dữ liệu 3 bảng cho Dashboard — Cache 30 giây (realtime)
router.get('/dashboard', withCache('warehouse-status:dashboard', TTL.VERY_SHORT), getWarehouseDashboard);

// [PUT] API Tiêu hủy lô hàng chết (Cập nhật tồn kho = 0) → Xóa cache
router.put('/discard/:batchId', validateData(discardBatchSchema), discardBatch);

export default router;