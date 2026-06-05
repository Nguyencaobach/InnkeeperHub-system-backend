import express from 'express';
import { createProduct, getAllProducts, updateProduct, deleteProduct } from './product.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { productSchema } from './product.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
// Import middleware upload ảnh CỦA SẢN PHẨM
import { uploadProductImage } from '../../../../shared/middlewares/upload.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getAllProducts);
router.post('/', uploadProductImage.single('image'), validateData(productSchema), createProduct);
router.put('/:id', uploadProductImage.single('image'), validateData(productSchema), updateProduct);
router.delete('/:id', deleteProduct);

export default router;