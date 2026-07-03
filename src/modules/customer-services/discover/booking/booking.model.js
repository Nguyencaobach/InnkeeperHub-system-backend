import pool from '../../../../shared/database/db.js';
import fs from 'fs';
import path from 'path';

export const createCustomerBookingTransaction = async (bookingData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // 1. Tạo Phiên thuê (Booking)
        const insertBookingQuery = `
            INSERT INTO bookings (
                booking_code, room_type_id, room_detail_id, customer_id,
                guest_name, guest_phone, guest_email,
                rent_type, booking_status, is_currently_rented,
                expected_checkin, expected_checkout, total_amount, payment_status,
                payos_order_code, deposit_amount,
                cccd_front_url, cccd_back_url
            ) VALUES (
                $1, $2, $3, $4, 
                $5, $6, $7, 
                $8, 'RESERVED', false, 
                $9, $10, $11, 'UNPAID',
                $12, $13,
                $14, $15
            ) RETURNING *;
        `;
        
        const bookingValues = [
            bookingData.booking_code, bookingData.room_type_id, bookingData.room_detail_id, bookingData.customer_id,
            bookingData.guest_name, bookingData.guest_phone, bookingData.guest_email, 
            bookingData.rent_type, 
            bookingData.expected_checkin, bookingData.expected_checkout, bookingData.total_amount,
            bookingData.payos_order_code, bookingData.deposit_amount,
            bookingData.cccd_front_url || null, bookingData.cccd_back_url || null
        ];
        
        const resBooking = await client.query(insertBookingQuery, bookingValues);
        const newBooking = resBooking.rows[0];

        // 2. Cập nhật trạng thái phòng thành 'RESERVED' thay vì 'OCCUPIED' vì khách chưa đến
        if (bookingData.room_detail_id) {
            const updateRoomQuery = `
                UPDATE room_details 
                SET status = 'RESERVED' 
                WHERE id = $1 
                RETURNING room_number;
            `;
            await client.query(updateRoomQuery, [bookingData.room_detail_id]);
        }

        await client.query('COMMIT'); 
        return newBooking;

    } catch (error) {
        await client.query('ROLLBACK'); 
        throw error;
    } finally {
        client.release(); 
    }
};

export const getRoomAvailabilityModel = async (roomDetailId) => {
    const query = `
        SELECT 
            expected_checkin, 
            expected_checkout, 
            booking_status 
        FROM bookings 
        WHERE room_detail_id = $1 
          AND booking_status IN ('RESERVED', 'RENTED');
    `;
    
    try {
        const { rows } = await pool.query(query, [roomDetailId]);
        return rows;
    } catch (error) {
        throw error;
    }
};

export const getBookingPaymentStatus = async (bookingId, customerId) => {
    const query = `
        SELECT booking_id, payment_status, booking_status 
        FROM bookings 
        WHERE booking_id = $1 AND customer_id = $2
    `;
    const result = await pool.query(query, [bookingId, customerId]);
    return result.rows[0] || null;
};

export const cancelBookingTransaction = async (bookingId, customerId) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Kiểm tra đơn hàng có hợp lệ để hủy không (của đúng khách, và đang UNPAID)
        const checkQuery = `
            SELECT booking_id, room_detail_id, payment_status, cccd_front_url, cccd_back_url
            FROM bookings
            WHERE booking_id = $1 AND customer_id = $2
        `;
        const resCheck = await client.query(checkQuery, [bookingId, customerId]);
        const booking = resCheck.rows[0];
        
        if (!booking) {
            throw new Error('Không tìm thấy phiên đặt phòng.');
        }
        
        if (booking.payment_status !== 'UNPAID') {
            throw new Error('Không thể hủy đơn đặt phòng đã thanh toán.');
        }
        
        // 2. Cập nhật trạng thái phòng về AVAILABLE
        if (booking.room_detail_id) {
            const updateRoomQuery = `
                UPDATE room_details 
                SET status = 'AVAILABLE' 
                WHERE id = $1
            `;
            await client.query(updateRoomQuery, [booking.room_detail_id]);
        }
        
        // 3. Xóa đơn đặt phòng
        const deleteQuery = `DELETE FROM bookings WHERE booking_id = $1`;
        await client.query(deleteQuery, [bookingId]);
        
        // 4. Dọn dẹp ảnh CCCD lưu tạm
        const urls = [booking.cccd_front_url, booking.cccd_back_url];
        for (const url of urls) {
            if (url && url.includes('/uploads/cccd_for_reserved/')) {
                const filePath = path.join(process.cwd(), 'public', url);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (err) {
                        console.error(`Không thể xóa file ảnh CCCD: ${filePath}`, err);
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Lỗi khi hủy đơn đặt phòng:", error);
        throw error;
    } finally {
        client.release();
    }
};
