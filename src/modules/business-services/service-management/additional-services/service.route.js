import express from 'express';
import { createService, getAllServices, updateService, deleteService } from './service.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { serviceSchema } from './service.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { uploadAdditionalServiceImage } from '../../../../shared/middlewares/upload.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getAllServices);
// Khi gọi POST/PUT, Multer xử lý file 'image' trước, sau đó Joi check text, cuối cùng vào Controller
router.post('/', uploadAdditionalServiceImage.single('image'), validateData(serviceSchema), createService);
router.put('/:id', uploadAdditionalServiceImage.single('image'), validateData(serviceSchema), updateService);
router.delete('/:id', deleteService);

export default router;