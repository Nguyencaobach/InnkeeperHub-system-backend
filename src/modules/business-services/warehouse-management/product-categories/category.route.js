import express from 'express';
import { createCategory, getAllCategories, updateCategory, deleteCategory } from './category.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { createCategorySchema, updateCategorySchema } from './category.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { withCache } from '../../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../../shared/services/cache.service.js';

const router = express.Router();

// Bắt buộc đăng nhập mới được xem và thao tác
router.use(verifyToken);

// [GET] Danh sách danh mục — Cache 6 giờ (danh mục rất ổn định)
router.get('/', withCache('product-categories:all', TTL.VERY_LONG), getAllCategories);

// [POST/PUT/DELETE] Ghi DB → Xóa cache
router.post('/', validateData(createCategorySchema), createCategory);

router.put('/:id', validateData(updateCategorySchema), updateCategory);

router.delete('/:id', deleteCategory);

export default router;