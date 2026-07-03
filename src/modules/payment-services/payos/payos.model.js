import pool from '../../../shared/database/db.js';

/**
 * Cập nhật trạng thái thanh toán của đơn đặt phòng dựa vào mã đơn hàng PayOS
 * @param {string|number} orderCode 
 * @param {string} paymentStatus ('DEPOSITED', 'PAID', 'UNPAID')
 */
export const updatePaymentStatusByOrderCode = async (orderCode, paymentStatus) => {
    const query = `
        UPDATE bookings
        SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE payos_order_code = $2
        RETURNING *;
    `;
    const result = await pool.query(query, [paymentStatus, orderCode]);
    return result.rows[0] || null;
};

/**
 * Lưu lịch sử giao dịch thanh toán
 */
export const insertPaymentTransaction = async (bookingId, orderCode, transactionId, amount, status = 'SUCCESS') => {
    const query = `
        INSERT INTO payment_transactions (booking_id, order_code, transaction_id, amount, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const result = await pool.query(query, [bookingId, orderCode, transactionId, amount, status]);
    return result.rows[0];
};
