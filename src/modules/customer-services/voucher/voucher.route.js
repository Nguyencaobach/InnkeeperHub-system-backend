import express from 'express';
import voucherController from './voucher.controller.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { withCache } from '../../../shared/middlewares/cache.middleware.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES DÀNH CHO CUSTOMER (App Mobile) — Bắt buộc đăng nhập
// ═══════════════════════════════════════════════════════════════════════════════

// [GET] Lấy điểm + member_code của khách đang đăng nhập
router.get(
    '/points',
    verifyToken,
    voucherController.getMyPoints.bind(voucherController)
);

// [GET] Kho voucher — Danh sách voucher có thể đổi bằng điểm
router.get(
    '/available',
    verifyToken,
    withCache('customer:discounts', 3600),
    voucherController.getAvailableVouchers.bind(voucherController)
);

// [POST] Đổi điểm lấy voucher — body: { discount_id }
router.post(
    '/exchange',
    verifyToken,
    voucherController.exchangeVoucher.bind(voucherController)
);

// [GET] Ví voucher cá nhân (chưa sử dụng)
router.get(
    '/my-wallet',
    verifyToken,
    voucherController.getMyWallet.bind(voucherController)
);

// [GET] Lịch sử biến động điểm
router.get(
    '/point-history',
    verifyToken,
    voucherController.getPointHistory.bind(voucherController)
);

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES DÀNH CHO STAFF/ADMIN (Website) — Bắt buộc đăng nhập
// ═══════════════════════════════════════════════════════════════════════════════

// [GET] Quét barcode member_code → trả thông tin khách
router.get(
    '/lookup-member/:code',
    verifyToken,
    voucherController.lookupMember.bind(voucherController)
);

// [POST] Validate + áp dụng mã giảm giá — body: { code }
router.post(
    '/apply-discount',
    verifyToken,
    voucherController.applyDiscount.bind(voucherController)
);

// [POST] Cộng điểm cho khách sau thanh toán — body: { customer_id, amount, reference_code }
router.post(
    '/add-points',
    verifyToken,
    voucherController.addPoints.bind(voucherController)
);

// [POST] Ghi nhận sử dụng mã giảm giá — body: { code }
router.post(
    '/use-discount',
    verifyToken,
    voucherController.useDiscount.bind(voucherController)
);

export default router;
