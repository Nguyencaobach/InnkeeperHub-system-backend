import express from 'express';
import { createDiscount, getAllDiscounts, updateDiscount, deleteDiscount } from './discount.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { discountSchema } from './discount.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';

const router = express.Router();

// Bắt buộc phải có token đăng nhập mới được thao tác
router.use(verifyToken);

// Lấy danh sách (không cần Joi validation)
router.get('/', getAllDiscounts);

// Thêm mới: Chạy qua phễu Joi -> Controller
router.post('/', validateData(discountSchema), createDiscount);

// Cập nhật: Chạy qua phễu Joi -> Controller
router.put('/:id', validateData(discountSchema), updateDiscount);

// Xóa (không cần Joi validation)
router.delete('/:id', deleteDiscount);

export default router;