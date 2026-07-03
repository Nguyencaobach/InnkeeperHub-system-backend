import express from 'express';
import { handlePayOSWebhook } from './payos.controller.js';

const router = express.Router();

// [POST] Webhook url cho PayOS gọi về khi thanh toán thành công
router.post('/webhook', handlePayOSWebhook);

export default router;
