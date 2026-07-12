import pool from '../../../../shared/database/db.js';

export const createBookingTransaction = async (bookingData) => {
    // Rút 1 kết nối (client) từ pool để thực hiện Transaction
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN'); // Bắt đầu giao dịch

        // 1. Tạo Phiên thuê (Booking)
        const insertBookingQuery = `
            INSERT INTO bookings (
                booking_code, room_type_id, room_detail_id, created_by,
                guest_name, guest_phone, guest_email, cccd_front_url, cccd_back_url,
                rent_type, booking_status, is_currently_rented,
                expected_checkin, expected_checkout, actual_checkin, total_amount, payment_status
            ) VALUES (
                $1, $2, $3, $4, 
                $5, $6, $7, $8, $9, 
                $10, 'RENTED', true, 
                $11, $12, $13, $14, 'UNPAID'
            ) RETURNING *;
        `;
        
        const bookingValues = [
            bookingData.booking_code, bookingData.room_type_id, bookingData.room_detail_id, bookingData.created_by,
            bookingData.guest_name, bookingData.guest_phone, bookingData.guest_email, 
            bookingData.cccd_front_url, bookingData.cccd_back_url,
            bookingData.rent_type, bookingData.expected_checkin, bookingData.expected_checkout, 
            bookingData.actual_checkin, bookingData.total_amount
        ];
        
        const resBooking = await client.query(insertBookingQuery, bookingValues);
        const newBooking = resBooking.rows[0];

        // 2. Cập nhật trạng thái phòng thành 'OCCUPIED'
        const updateRoomQuery = `
            UPDATE room_details 
            SET status = 'OCCUPIED' 
            WHERE id = $1 
            RETURNING room_number;
        `;
        await client.query(updateRoomQuery, [bookingData.room_detail_id]);

        await client.query('COMMIT'); // Lưu thay đổi vào Database
        return newBooking;

    } catch (error) {
        await client.query('ROLLBACK'); // Hủy toàn bộ nếu có lỗi
        throw error;
    } finally {
        client.release(); // Trả kết nối lại cho pool
    }
};

// ── Lấy phiên thuê đang active theo room_detail_id ──────────────────────────
export const getActiveBookingByRoomId = async (roomDetailId) => {
    const query = `
        SELECT * FROM bookings
        WHERE room_detail_id = $1
          AND is_currently_rented = true
          AND booking_status = 'RENTED'
        ORDER BY created_at DESC
        LIMIT 1;
    `;
    const result = await pool.query(query, [roomDetailId]);
    return result.rows[0] || null;
};

// ── Lấy phiên thuê theo ID ───────────────────────────────────────────────────
export const getBookingById = async (id) => {
    const result = await pool.query('SELECT * FROM bookings WHERE booking_id = $1', [id]);
    return result.rows[0] || null;
};

// ── Cập nhật thông tin phiên thuê ────────────────────────────────────────────
export const updateBookingById = async (id, data) => {
    const {
        guest_name, guest_phone, guest_email,
        rent_type, expected_checkin, expected_checkout
    } = data;

    // Xây dựng câu SET động — chỉ cập nhật trường nào được frontend gửi lên
    const setClauses = [];
    const values = [];
    let idx = 1;

    setClauses.push(`guest_name = $${idx++}`);
    values.push(guest_name);

    setClauses.push(`guest_phone = $${idx++}`);
    values.push(guest_phone);

    setClauses.push(`guest_email = $${idx++}`);
    values.push(guest_email ?? null);

    // Chỉ cập nhật nếu frontend có gửi
    if (rent_type !== undefined) {
        setClauses.push(`rent_type = $${idx++}`);
        values.push(rent_type);
    }
    if (expected_checkin !== undefined) {
        setClauses.push(`expected_checkin = $${idx++}`);
        values.push(expected_checkin);
    }

    // expected_checkout luôn cập nhật (null = xóa checkout dự kiến)
    setClauses.push(`expected_checkout = $${idx++}`);
    values.push(expected_checkout ?? null);

    setClauses.push(`updated_at = NOW()`);

    values.push(id); // tham số WHERE cuối cùng

    const query = `
        UPDATE bookings
        SET ${setClauses.join(', ')}
        WHERE booking_id = $${idx}
        RETURNING *;
    `;

    const result = await pool.query(query, values);
    if (result.rowCount === 0) throw new Error('Không tìm thấy phiên thuê.');
    return result.rows[0];
};

// ── Thanh toán & Trả phòng ────────────────────────────────────────────────────
export const checkoutBookingById = async (id, paymentData = {}) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lấy thông tin booking đầy đủ để snapshot
        const bookingRes = await client.query(
            `SELECT * FROM bookings WHERE booking_id = $1`,
            [id]
        );
        if (bookingRes.rowCount === 0) throw new Error('Không tìm thấy phiên thuê.');
        const booking = bookingRes.rows[0];

        // 2. Tính actual_duration_minutes
        const actualCheckout = new Date();
        const actualCheckin = booking.actual_checkin ? new Date(booking.actual_checkin) : new Date(booking.expected_checkin);
        const durationMinutes = Math.floor((actualCheckout - actualCheckin) / 60_000);

        // 3. Cập nhật bookings → COMPLETED
        const updateBookingQuery = `
            UPDATE bookings
            SET
                booking_status          = 'COMPLETED',
                is_currently_rented     = false,
                actual_checkout         = $1,
                actual_duration_minutes = $2,
                payment_status          = 'PAID',
                total_amount            = $3,
                discount_amount         = $4,
                discount_code           = $5,
                updated_at              = NOW()
            WHERE booking_id = $6
            RETURNING room_detail_id, booking_code;
        `;
        const resBooking = await client.query(updateBookingQuery, [
            actualCheckout,
            durationMinutes,
            paymentData.final_amount ?? 0,
            paymentData.discount_amount ?? 0,
            paymentData.discount_code ?? null,
            id
        ]);
        const { room_detail_id, booking_code } = resBooking.rows[0];

        // 4. Cập nhật phòng → CLEANING (cần dọn)
        await client.query(
            `UPDATE room_details SET status = 'CLEANING' WHERE id = $1`,
            [room_detail_id]
        );

        // 5. Lấy room_number
        const roomRes = await client.query(
            `SELECT room_number FROM room_details WHERE id = $1`,
            [room_detail_id]
        );
        const room_number = roomRes.rows[0]?.room_number || null;

        // 6. Sinh bill_id
        const billId = `BILL-${Math.floor(100000 + Math.random() * 900000)}`;

        // 7. Insert bill_payments
        await client.query(
            `INSERT INTO bill_payments (
                id, booking_code, cashier_id,
                room_number, guest_name, guest_phone, guest_email,
                cccd_front_url, cccd_back_url,
                rent_type, actual_checkin, actual_checkout,
                room_price, service_price, discount_amount, discount_code, deposit_amount, deposit_applied,
                final_amount, payment_method, services_detail
            ) VALUES (
                $1, $2, $3,
                $4, $5, $6, $7,
                $8, $9,
                $10, $11, $12,
                $13, $14, $15, $16, $17, $18,
                $19, $20, $21
            )`,
            [
                billId, booking_code, paymentData.cashier_id ?? null,
                room_number, booking.guest_name, booking.guest_phone, booking.guest_email,
                booking.cccd_front_url, booking.cccd_back_url,
                booking.rent_type, actualCheckin, actualCheckout,
                paymentData.room_price ?? 0,
                paymentData.service_price ?? 0,
                paymentData.discount_amount ?? 0,
                paymentData.discount_code ?? null,
                booking.deposit_amount ?? 0,
                (booking.deposit_amount && booking.deposit_amount > 0) ? true : false,
                paymentData.final_amount ?? 0,
                paymentData.payment_method ?? 'CASH',
                JSON.stringify(paymentData.services_detail ?? [])
            ]
        );

        // 8. Cộng điểm cho khách hàng (nếu có)
        if (paymentData.memberCode && paymentData.pointsToEarn) {
            await client.query(
                `UPDATE customers SET current_points = COALESCE(current_points, 0) + $1 WHERE member_code = $2`,
                [paymentData.pointsToEarn, paymentData.memberCode]
            );
            // Ghi log biến động điểm
            const customerRes = await client.query(`SELECT customer_id FROM customers WHERE member_code = $1`, [paymentData.memberCode]);
            if (customerRes.rowCount > 0) {
                const customerId = customerRes.rows[0].customer_id;
                await client.query(
                    `INSERT INTO point_transactions (customer_id, amount, description, reference_code)
                     VALUES ($1, $2, $3, $4)`,
                    [customerId, paymentData.pointsToEarn, `Tích điểm từ hóa đơn ${billId}`, billId]
                );
            }
        }

        // 9. Giảm lượt sử dụng của mã giảm giá (nếu có)
        if (paymentData.discount_code) {
            await client.query(
                `UPDATE discount_codes 
                 SET usage_limit = usage_limit - 1, updated_at = NOW() 
                 WHERE code = $1 AND usage_limit IS NOT NULL AND usage_limit > 0`,
                [paymentData.discount_code]
            );

            // Nếu người dùng có đăng nhập memberCode, đánh dấu voucher trong ví là đã sử dụng
            if (paymentData.memberCode) {
                await client.query(
                    `UPDATE customer_vouchers cv
                     SET is_used = TRUE, used_at = NOW()
                     FROM discount_codes dc, customers c
                     WHERE cv.discount_id = dc.discount_id
                       AND cv.customer_id = c.customer_id
                       AND dc.code = $1
                       AND c.member_code = $2
                       AND cv.is_used = FALSE`,
                    [paymentData.discount_code, paymentData.memberCode]
                );
            }
        }

        await client.query('COMMIT');
        return { booking_code, bill_id: billId };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// ── Kiểm tra xung đột lịch RESERVED trước khi tạo phiên thuê (admin) ─────────
// Logic tham khảo từ customer-services/discover/booking (getRoomAvailabilityModel)
// Overlap condition: existing.checkin < proposed.checkout AND existing.checkout > proposed.checkin
export const checkReservedConflict = async (roomDetailId, proposedCheckin, proposedCheckout) => {
    // Nếu admin không cung cấp checkout → xem như vô thời hạn (9999) 
    // để bất kỳ lịch đặt trước nào trong tương lai cũng sẽ báo trùng lịch
    const effectiveCheckout = proposedCheckout
        ? new Date(proposedCheckout)
        : new Date('9999-12-31T23:59:59.999Z');

    const query = `
        SELECT 
            booking_id, 
            booking_code, 
            guest_name,
            expected_checkin, 
            expected_checkout
        FROM bookings
        WHERE room_detail_id = $1
          AND booking_status = 'RESERVED'
          AND expected_checkin <= $3
          AND expected_checkout >= $2
        ORDER BY expected_checkin ASC;
    `;

    const result = await pool.query(query, [
        roomDetailId,
        new Date(proposedCheckin),
        effectiveCheckout
    ]);

    return result.rows; // Trả về tất cả các lịch trùng
};