import express from 'express';
import { getWarehouseDashboard, discardBatch } from './warehouse_status.controller.js';
import { discardBatchSchema } from './warehouse_status.validation.js'; // Nhớ đổi tên file ở bước 1 thành warehouse_status.validation.js
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';

const router = express.Router();

// Bắt buộc phải đăng nhập
router.use(verifyToken);

// [GET] API Lấy toàn bộ dữ liệu 3 bảng cho Dashboard
router.get('/dashboard', getWarehouseDashboard);

// [PUT] API Tiêu hủy lô hàng chết (Cập nhật tồn kho = 0)
router.put('/discard/:batchId', validateData(discardBatchSchema), discardBatch);

export default router;