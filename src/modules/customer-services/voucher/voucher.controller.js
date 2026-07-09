import voucherService from './voucher.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';

class VoucherController {
    // ── CUSTOMER: Lấy điểm + member_code ─────────────────────────────────────
    async getMyPoints(req, res) {
        try {
            const customerId = req.user.customer_id;
            const data = await voucherService.getCustomerPoints(customerId);
            return sendSuccess(res, data, 'Lấy thông tin điểm thành công', STATUS_CODES.OK);
        } catch (error) {
            console.error('[VoucherController] getMyPoints Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
        }
    }

    // ── CUSTOMER: Kho voucher ────────────────────────────────────────────────
    async getAvailableVouchers(req, res) {
        try {
            const data = await voucherService.getAvailableVouchers();
            return sendSuccess(res, data, 'Lấy danh sách voucher thành công', STATUS_CODES.OK);
        } catch (error) {
            console.error('[VoucherController] getAvailableVouchers Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
        }
    }

    // ── CUSTOMER: Đổi điểm lấy voucher ──────────────────────────────────────
    async exchangeVoucher(req, res) {
        try {
            const customerId = req.user.customer_id;
            const { discount_id } = req.body;
            const data = await voucherService.exchangeVoucher(customerId, discount_id);
            return sendSuccess(res, data, 'Đổi voucher thành công!', STATUS_CODES.CREATED);
        } catch (error) {
            console.error('[VoucherController] exchangeVoucher Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
        }
    }

    // ── CUSTOMER: Ví voucher ────────────────────────────────────────────────
    async getMyWallet(req, res) {
        try {
            const customerId = req.user.customer_id;
            const data = await voucherService.getMyVouchers(customerId);
            return sendSuccess(res, data, 'Lấy ví voucher thành công', STATUS_CODES.OK);
        } catch (error) {
            console.error('[VoucherController] getMyWallet Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
        }
    }

    // ── CUSTOMER: Lịch sử điểm ──────────────────────────────────────────────
    async getPointHistory(req, res) {
        try {
            const customerId = req.user.customer_id;
            const data = await voucherService.getPointHistory(customerId);
            return sendSuccess(res, data, 'Lấy lịch sử điểm thành công', STATUS_CODES.OK);
        } catch (error) {
            console.error('[VoucherController] getPointHistory Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
        }
    }

    // ── STAFF: Quét barcode member_code ──────────────────────────────────────
    async lookupMember(req, res) {
        try {
            const { code } = req.params;
            const data = await voucherService.lookupMember(code);
            return sendSuccess(res, data, 'Tìm khách hàng thành công', STATUS_CODES.OK);
        } catch (error) {
            console.error('[VoucherController] lookupMember Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
        }
    }

    // ── STAFF: Validate + áp dụng mã giảm giá ──────────────────────────────
    async applyDiscount(req, res) {
        try {
            const { code } = req.body;
            const data = await voucherService.applyDiscount(code);
            return sendSuccess(res, data, 'Mã giảm giá hợp lệ', STATUS_CODES.OK);
        } catch (error) {
            console.error('[VoucherController] applyDiscount Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
        }
    }

    // ── STAFF: Cộng điểm cho khách ──────────────────────────────────────────
    async addPoints(req, res) {
        try {
            const { customer_id, amount, reference_code } = req.body;
            const data = await voucherService.addPoints(customer_id, amount, reference_code);
            return sendSuccess(res, data, 'Cộng điểm thành công', STATUS_CODES.OK);
        } catch (error) {
            console.error('[VoucherController] addPoints Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
        }
    }

    // ── STAFF: Sử dụng mã giảm giá (gọi sau thanh toán) ────────────────────
    async useDiscount(req, res) {
        try {
            const { code } = req.body;
            await voucherService.useDiscount(code);
            return sendSuccess(res, null, 'Đã ghi nhận sử dụng mã giảm giá', STATUS_CODES.OK);
        } catch (error) {
            console.error('[VoucherController] useDiscount Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
        }
    }
}

export default new VoucherController();
