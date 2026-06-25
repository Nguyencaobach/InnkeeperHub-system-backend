import express from 'express';
import { createCustomer, getAllCustomers, updateCustomer, deleteCustomer } from './customer.controller.js';
import { createCustomerSchema, updateCustomerSchema } from './customer.validation.js';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { withCache, invalidateCache } from '../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../shared/services/cache.service.js';

const router = express.Router();

// Yêu cầu nhân viên/quản lý phải đăng nhập mới được thao tác quản lý khách hàng
router.use(verifyToken);

// [GET] Danh sách khách hàng — Cache 10 phút
router.get('/', withCache('customers:all', TTL.NORMAL), getAllCustomers);

// [POST] Thêm mới
router.post('/', validateData(createCustomerSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('customers:*'); });
    next();
}, createCustomer);

// [PUT] Cập nhật
router.put('/:id', validateData(updateCustomerSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('customers:*'); });
    next();
}, updateCustomer);

// [DELETE] Xóa
router.delete('/:id', async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('customers:*'); });
    next();
}, deleteCustomer);

export default router;