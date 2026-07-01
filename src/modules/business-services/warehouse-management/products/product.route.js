import express from 'express';
import { createProduct, getAllProducts, updateProduct, deleteProduct } from './product.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { productSchema } from './product.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { uploadProductImage } from '../../../../shared/middlewares/upload.middleware.js';
import { withCache } from '../../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../../shared/services/cache.service.js';

const router = express.Router();

router.use(verifyToken);

// [GET] Danh sách sản phẩm kho — Cache 15 phút
router.get('/', withCache('products:all', TTL.LONG), getAllProducts);

// [POST/PUT/DELETE] Ghi DB → Xóa cache sản phẩm
router.post('/', uploadProductImage.single('image'), validateData(productSchema), createProduct);

router.put('/:id', uploadProductImage.single('image'), validateData(productSchema), updateProduct);

router.delete('/:id', deleteProduct);

export default router;