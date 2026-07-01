import express from 'express';
import { createBatch, getBatches, updateBatch, deleteBatch } from './product-batch.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { productBatchSchema } from './product-batch.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { withCache, invalidateCache } from '../../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../../shared/services/cache.service.js';

const router = express.Router();

// Bắt buộc đăng nhập
router.use(verifyToken);

// [GET] Danh sách lô hàng — Cache 10 phút
// Lưu ý: Hàm GET sẽ đi kèm query parameter: ?product_id=...
router.get('/', withCache('product-batches:all', TTL.NORMAL), getBatches);

// [POST/PUT/DELETE] Ghi DB → Xóa cache
router.post('/', validateData(productBatchSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('product-batches:*', 'customer:*product-batches:*'); });
    next();
}, createBatch);

router.put('/:id', validateData(productBatchSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('product-batches:*', 'customer:*product-batches:*'); });
    next();
}, updateBatch);

router.delete('/:id', async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('product-batches:*', 'customer:*product-batches:*'); });
    next();
}, deleteBatch);

export default router;