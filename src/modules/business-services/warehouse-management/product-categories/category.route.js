import express from 'express';
import { createCategory, getAllCategories, updateCategory, deleteCategory } from './category.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { createCategorySchema, updateCategorySchema } from './category.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';

const router = express.Router();

// Bắt buộc đăng nhập mới được xem và thao tác
router.use(verifyToken);

// Danh sách API
router.get('/', getAllCategories);
router.post('/', validateData(createCategorySchema), createCategory);
router.put('/:id', validateData(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export default router;