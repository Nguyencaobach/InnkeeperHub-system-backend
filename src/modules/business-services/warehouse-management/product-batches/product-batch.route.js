import express from 'express';
import { createBatch, getBatches, updateBatch, deleteBatch } from './product-batch.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { productBatchSchema } from './product-batch.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';

const router = express.Router();

// Bắt buộc đăng nhập
router.use(verifyToken);

router.get('/', getBatches); // Lưu ý: Hàm GET sẽ đi kèm query parameter: ?product_id=...
router.post('/', validateData(productBatchSchema), createBatch);
router.put('/:id', validateData(productBatchSchema), updateBatch);
router.delete('/:id', deleteBatch);

export default router;