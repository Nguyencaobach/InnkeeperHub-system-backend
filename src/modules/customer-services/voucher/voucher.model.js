import pool from '../../../shared/database/db.js';

class VoucherModel {
    // ── LẤY ĐIỂM + MEMBER CODE CỦA KHÁCH ─────────────────────────────────────
    async getCustomerPoints(customerId) {
        const query = `
            SELECT customer_id, full_name, member_code, current_points
            FROM customers
            WHERE customer_id = $1
        `;
        const result = await pool.query(query, [customerId]);
        return result.rows[0] || null;
    }

    // ── KHO VOUCHER (Danh sách voucher có thể đổi bằng điểm) ─────────────────
    async getAvailableVouchers() {
        const query = `
            SELECT discount_id, code, description, discount_amount, 
                   min_order_value, usage_limit, points_required, 
                   start_date, end_date, is_active
            FROM discount_codes
            WHERE is_active = TRUE
              AND points_required > 0
              AND (usage_limit IS NULL OR usage_limit > 0)
              AND (end_date IS NULL OR end_date::DATE >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE)
            ORDER BY points_required ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    // ── ĐỔI ĐIỂM LẤY VOUCHER (Transaction) ──────────────────────────────────
    async exchangeVoucher(customerId, discountId, pointsRequired) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Kiểm tra điểm hiện tại
            const pointRes = await client.query(
                `SELECT current_points FROM customers WHERE customer_id = $1 FOR UPDATE`,
                [customerId]
            );
            const currentPoints = pointRes.rows[0]?.current_points ?? 0;
            if (currentPoints < pointsRequired) {
                throw new Error(`Không đủ điểm. Bạn có ${currentPoints} điểm, cần ${pointsRequired} điểm.`);
            }

            // 2. Kiểm tra voucher còn hợp lệ
            const voucherRes = await client.query(
                `SELECT discount_id, code, usage_limit, is_active, end_date 
                 FROM discount_codes WHERE discount_id = $1`,
                [discountId]
            );
            const voucher = voucherRes.rows[0];
            if (!voucher) throw new Error('Voucher không tồn tại.');
            if (!voucher.is_active) throw new Error('Voucher đã bị khóa.');
            if (voucher.usage_limit !== null && voucher.usage_limit <= 0) throw new Error('Voucher đã hết lượt sử dụng.');

            // 3. Trừ điểm
            await client.query(
                `UPDATE customers SET current_points = current_points - $1 WHERE customer_id = $2`,
                [pointsRequired, customerId]
            );

            // 4. Thêm voucher vào ví
            const walletRes = await client.query(
                `INSERT INTO customer_vouchers (customer_id, discount_id)
                 VALUES ($1, $2) RETURNING *`,
                [customerId, discountId]
            );

            // 5. Ghi lịch sử biến động điểm
            await client.query(
                `INSERT INTO point_transactions (customer_id, amount, description, reference_code)
                 VALUES ($1, $2, $3, $4)`,
                [customerId, -pointsRequired, `Đổi Voucher: ${voucher.code}`, voucher.code]
            );

            await client.query('COMMIT');
            return walletRes.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    // ── VÍ VOUCHER CỦA KHÁCH (Chưa dùng) ────────────────────────────────────
    async getMyVouchers(customerId) {
        const query = `
            SELECT cv.id, cv.discount_id, cv.is_used, cv.acquired_at, cv.used_at,
                   dc.code, dc.description, dc.discount_amount, 
                   dc.min_order_value, dc.end_date, dc.is_active
            FROM customer_vouchers cv
            JOIN discount_codes dc ON cv.discount_id = dc.discount_id
            WHERE cv.customer_id = $1 AND cv.is_used = FALSE
            ORDER BY cv.acquired_at DESC
        `;
        const result = await pool.query(query, [customerId]);
        return result.rows;
    }

    // ── LỊCH SỬ BIẾN ĐỘNG ĐIỂM ──────────────────────────────────────────────
    async getPointHistory(customerId) {
        const query = `
            SELECT id, amount, description, reference_code, created_at
            FROM point_transactions
            WHERE customer_id = $1
            ORDER BY created_at DESC
            LIMIT 50
        `;
        const result = await pool.query(query, [customerId]);
        return result.rows;
    }

    // ── TÌM KHÁCH THEO MEMBER CODE (Admin quét barcode) ──────────────────────
    async findCustomerByMemberCode(memberCode) {
        const query = `
            SELECT customer_id, full_name, username, phone_number, 
                   member_code, current_points, avatar_url
            FROM customers
            WHERE member_code = $1 AND is_active = TRUE
        `;
        const result = await pool.query(query, [memberCode]);
        return result.rows[0] || null;
    }

    // ── CỘNG ĐIỂM CHO KHÁCH SAU THANH TOÁN ──────────────────────────────────
    async addPointsToCustomer(customerId, amount, refCode, description) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Cộng điểm
            await client.query(
                `UPDATE customers SET current_points = current_points + $1 WHERE customer_id = $2`,
                [amount, customerId]
            );

            // Ghi lịch sử
            await client.query(
                `INSERT INTO point_transactions (customer_id, amount, description, reference_code)
                 VALUES ($1, $2, $3, $4)`,
                [customerId, amount, description || `Tích điểm từ hóa đơn ${refCode}`, refCode]
            );

            await client.query('COMMIT');
            
            // Trả về điểm mới
            const res = await pool.query(
                `SELECT current_points FROM customers WHERE customer_id = $1`, [customerId]
            );
            return res.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    // ── VALIDATE MÃ GIẢM GIÁ (Admin nhập thủ công) ──────────────────────────
    async validateDiscountCode(code) {
        const query = `
            SELECT discount_id, code, description, discount_amount, 
                   min_order_value, usage_limit, is_active, end_date
            FROM discount_codes
            WHERE code = $1
        `;
        const result = await pool.query(query, [code]);
        return result.rows[0] || null;
    }

    // ── SỬ DỤNG MÃ GIẢM GIÁ (Giảm usage_limit + đánh dấu ví) ──────────────
    async useDiscountCode(code) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Giảm usage_limit
            await client.query(
                `UPDATE discount_codes SET usage_limit = usage_limit - 1, 
                 updated_at = CURRENT_TIMESTAMP
                 WHERE code = $1 AND usage_limit > 0`,
                [code]
            );

            // Nếu voucher này nằm trong ví khách → đánh dấu is_used
            await client.query(
                `UPDATE customer_vouchers SET is_used = TRUE, used_at = CURRENT_TIMESTAMP
                 WHERE id = (
                     SELECT id FROM customer_vouchers 
                     WHERE discount_id = (SELECT discount_id FROM discount_codes WHERE code = $1)
                       AND is_used = FALSE
                     LIMIT 1
                 )`,
                [code]
            );

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}

export default new VoucherModel();
