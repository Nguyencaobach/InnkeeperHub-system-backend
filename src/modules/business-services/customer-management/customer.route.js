import express from 'express';
import { createCustomer, getAllCustomers, updateCustomer, deleteCustomer } from './customer.controller.js';
import { createCustomerSchema, updateCustomerSchema } from './customer.validation.js';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';

const router = express.Router();

// Yêu cầu nhân viên/quản lý phải đăng nhập mới được thao tác quản lý khách hàng
router.use(verifyToken);

router.get('/', getAllCustomers);
router.post('/', validateData(createCustomerSchema), createCustomer);
router.put('/:id', validateData(updateCustomerSchema), updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;