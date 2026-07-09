import voucherModel from './voucher.model.js';

class VoucherService {
    // ── CUSTOMER: Lấy điểm + member_code ─────────────────────────────────────
    async getCustomerPoints(customerId) {
        if (!customerId) throw new Error('Thiếu thông tin khách hàng.');
        return await voucherModel.getCustomerPoints(customerId);
    }

    // ── CUSTOMER: Kho voucher ────────────────────────────────────────────────
    async getAvailableVouchers() {
        return await voucherModel.getAvailableVouchers();
    }

    // ── CUSTOMER: Đổi điểm lấy voucher ──────────────────────────────────────
    async exchangeVoucher(customerId, discountId) {
        if (!customerId) throw new Error('Thiếu thông tin khách hàng.');
        if (!discountId) throw new Error('Thiếu mã voucher cần đổi.');

        // Lấy thông tin voucher để biết cần bao nhiêu điểm
        const vouchers = await voucherModel.getAvailableVouchers();
        const voucher = vouchers.find(v => v.discount_id === discountId);
        if (!voucher) throw new Error('Voucher không tồn tại hoặc đã hết hạn.');

        return await voucherModel.exchangeVoucher(customerId, discountId, voucher.points_required);
    }

    // ── CUSTOMER: Ví voucher ────────────────────────────────────────────────
    async getMyVouchers(customerId) {
        if (!customerId) throw new Error('Thiếu thông tin khách hàng.');
        return await voucherModel.getMyVouchers(customerId);
    }

    // ── CUSTOMER: Lịch sử điểm ──────────────────────────────────────────────
    async getPointHistory(customerId) {
        if (!customerId) throw new Error('Thiếu thông tin khách hàng.');
        return await voucherModel.getPointHistory(customerId);
    }

    // ── STAFF: Quét barcode member_code ──────────────────────────────────────
    async lookupMember(memberCode) {
        if (!memberCode) throw new Error('Thiếu mã thành viên.');
        const customer = await voucherModel.findCustomerByMemberCode(memberCode);
        if (!customer) throw new Error('Không tìm thấy khách hàng với mã này.');
        return customer;
    }

    // ── STAFF: Cộng điểm cho khách ──────────────────────────────────────────
    async addPoints(customerId, amount, refCode) {
        if (!customerId) throw new Error('Thiếu thông tin khách hàng.');
        if (!amount || amount <= 0) throw new Error('Số điểm phải lớn hơn 0.');
        return await voucherModel.addPointsToCustomer(
            customerId, amount, refCode, `Tích điểm từ hóa đơn ${refCode}`
        );
    }

    // ── STAFF: Validate mã giảm giá ────────────────────────────────────────
    async applyDiscount(code) {
        if (!code) throw new Error('Vui lòng nhập mã giảm giá.');
        
        const discount = await voucherModel.validateDiscountCode(code);
        if (!discount) throw new Error('Mã giảm giá không tồn tại.');
        if (!discount.is_active) throw new Error('Mã giảm giá đã bị khóa.');
        if (discount.usage_limit !== null && discount.usage_limit <= 0) throw new Error('Mã giảm giá đã hết lượt sử dụng.');
        
        // Kiểm tra hạn
        if (discount.end_date) {
            const now = new Date();
            const endDate = new Date(discount.end_date);
            endDate.setHours(23, 59, 59, 999); // Hết ngày end_date
            if (now > endDate) throw new Error('Mã giảm giá đã hết hạn.');
        }

        return discount;
    }

    // ── STAFF: Sử dụng mã giảm giá (sau thanh toán thành công) ─────────────
    async useDiscount(code) {
        if (!code) return;
        await voucherModel.useDiscountCode(code);
    }
}

export default new VoucherService();
