import express from 'express';
import { createProduct, getAllProducts, updateProduct, deleteProduct } from './product.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { productSchema } from './product.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { uploadProductImage } from '../../../../shared/middlewares/upload.middleware.js';
import { withCache, invalidateCache } from '../../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../../shared/services/cache.service.js';

const router = express.Router();

router.use(verifyToken);

// [GET] Danh sách sản phẩm kho — Cache 15 phút
router.get('/', withCache('products:all', TTL.LONG), getAllProducts);

// [POST/PUT/DELETE] Ghi DB → Xóa cache sản phẩm
router.post('/', uploadProductImage.single('image'), validateData(productSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('products:*'); });
    next();
}, createProduct);

router.put('/:id', uploadProductImage.single('image'), validateData(productSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('products:*'); });
    next();
}, updateProduct);

router.delete('/:id', async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('products:*'); });
    next();
}, deleteProduct);

export default router;