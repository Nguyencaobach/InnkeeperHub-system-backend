import { verifyWebhookData } from './payos.service.js';
import { updatePaymentStatusByOrderCode, insertPaymentTransaction } from './payos.model.js';
import { sendBookingConfirmationEmail } from '../../email-services/templates/booking-confirmation.email.js';

export const handlePayOSWebhook = async (req, res) => {
    try {
        const webhookBody = req.body;
        // 1. Xác thực dữ liệu Webhook từ PayOS
        const webhookData = verifyWebhookData(webhookBody);

        // 2. Nếu thanh toán thành công, cập nhật DB
        if (webhookBody.code === '00' || webhookBody.success) {
            
            // SỬA Ở ĐÂY: Lấy trực tiếp từ webhookBody.data thay vì webhookData
            const orderCode = webhookBody.data.orderCode;
            
            // Cập nhật trạng thái đơn hàng thành PAID
            const updatedBooking = await updatePaymentStatusByOrderCode(orderCode, 'PAID');
            
            if (updatedBooking) {
                // Lấy các dữ liệu webhook trả về
                const transactionId = webhookBody.data.reference || webhookBody.data.transactionId || null;
                const amount = webhookBody.data.amount;
                
                // Lưu vào bảng payment_transactions
                await insertPaymentTransaction(
                    updatedBooking.booking_id,
                    orderCode,
                    transactionId,
                    amount,
                    'SUCCESS'
                );

                // In ra Terminal một log thật đẹp và rõ ràng
                console.log('\n======================================================');
                console.log(`✅ [PAYOS WEBHOOK] THANH TOÁN THÀNH CÔNG!`);
                console.log(`   - Mã hệ thống (Booking): ${updatedBooking.booking_code}`);
                console.log(`   - Mã đơn hàng (OrderCode): ${orderCode}`);
                console.log(`   - Số tiền nhận được: ${amount.toLocaleString('vi-VN')} VNĐ`);
                console.log(`   - Mã giao dịch ngân hàng: ${transactionId}`);
                console.log('======================================================\n');

                // Gửi email xác nhận đặt phòng cho khách hàng (fire-and-forget)
                sendBookingConfirmationEmail({
                    guest_name: updatedBooking.customer_full_name || updatedBooking.guest_name,
                    customer_email: updatedBooking.customer_email,
                    guest_email: updatedBooking.guest_email,
                    booking_code: updatedBooking.booking_code,
                    order_code: orderCode,
                    room_number: updatedBooking.room_number,
                    room_type_name: updatedBooking.room_type_name,
                    check_in: updatedBooking.expected_checkin,
                    check_out: updatedBooking.expected_checkout,
                    rent_type: updatedBooking.rent_type,
                    total_amount: updatedBooking.total_amount,
                    deposit_amount: updatedBooking.deposit_amount,
                    transaction_id: transactionId,
                    payment_date: webhookBody.data.transactionDateTime,
                });
            } else {
                console.log(`⚠️ [PAYOS WEBHOOK] Đã nhận thanh toán cho OrderCode: ${orderCode} nhưng không tìm thấy đơn trong DB!`);
            }
        }

        // 3. Phản hồi cho PayOS biết đã nhận thành công (Tránh bị gọi lại nhiều lần)
        return res.status(200).json({
            error: 0,
            message: "Webhook received and processed",
            data: null
        });

    } catch (error) {
        console.error('Webhook processing failed:', error);
        // Trả về lỗi để PayOS có thể thử lại nếu cần
        return res.status(400).json({
            error: 1,
            message: "Failed to process webhook",
            data: error.message
        });
    }
};
