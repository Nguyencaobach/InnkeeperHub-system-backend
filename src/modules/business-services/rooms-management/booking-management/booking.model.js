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