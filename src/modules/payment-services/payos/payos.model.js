import pool from '../../../shared/database/db.js';

/**
 * Cập nhật trạng thái thanh toán của đơn đặt phòng dựa vào mã đơn hàng PayOS
 * @param {string|number} orderCode 
 * @param {string} paymentStatus ('DEPOSITED', 'PAID', 'UNPAID')
 */
export const updatePaymentStatusByOrderCode = async (orderCode, paymentStatus) => {
    const query = `
        UPDATE bookings b
        SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
        FROM room_details rd, room_types rt
        WHERE b.payos_order_code = $2
          AND rd.id = b.room_detail_id
          AND rt.id = b.room_type_id
        RETURNING b.*,
                  rd.room_number,
                  rt.name AS room_type_name;
    `;
    const result = await pool.query(query, [paymentStatus, orderCode]);
    
    const booking = result.rows[0] || null;

    // Nếu booking có customer_id, lấy thêm email từ bảng customers
    if (booking && booking.customer_id) {
        const customerResult = await pool.query(
            'SELECT email, full_name FROM customers WHERE customer_id = $1',
            [booking.customer_id]
        );
        if (customerResult.rows[0]) {
            booking.customer_email = customerResult.rows[0].email;
            booking.customer_full_name = customerResult.rows[0].full_name;
        }
    }

    return booking;
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
