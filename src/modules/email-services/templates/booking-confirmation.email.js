import { sendMail } from '../email.service.js';

// ============================================================
// TEMPLATE — Email xác nhận đặt phòng & thanh toán thành công
// @param {object} data - Thông tin đặt phòng đầy đủ
// ============================================================
const buildBookingConfirmationHtml = ({
    guest_name,
    booking_code,
    order_code,
    room_number,
    room_type_name,
    check_in,
    check_out,
    rent_type,
    total_amount,
    deposit_amount,
    transaction_id,
    payment_date,
}) => {
    // Format tiền VNĐ
    const formatVND = (amount) => Number(amount || 0).toLocaleString('vi-VN');
    
    // Format ngày giờ
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const rentTypeLabel = rent_type === 'HOURLY' ? 'Theo giờ' : 'Theo ngày';

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xác nhận đặt phòng thành công</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#065f46 0%,#047857 50%,#10b981 100%);padding:40px 48px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">✅</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Đặt phòng thành công!</h1>
              <p style="margin:8px 0 0;color:#a7f3d0;font-size:14px;">Thanh toán đã được xác nhận</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 48px;">
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
                Xin chào <strong style="color:#0f172a;">${guest_name}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi qua <strong>InnkeeperHub</strong>. 
                Đơn đặt phòng của bạn đã được xác nhận thành công. Dưới đây là chi tiết:
              </p>

              <!-- BOOKING INFO -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin:0 0 20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:13px;color:#166534;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">📋 Thông tin đặt phòng</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;width:160px;">Mã đặt phòng:</td>
                        <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:700;">${booking_code}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;">Phòng:</td>
                        <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${room_number} — ${room_type_name}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;">Hình thức thuê:</td>
                        <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${rentTypeLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;">Ngày nhận phòng:</td>
                        <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${formatDate(check_in)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;">Ngày trả phòng:</td>
                        <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${formatDate(check_out)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- PAYMENT INFO -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:0 0 20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:13px;color:#334155;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">💳 Thông tin thanh toán</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;width:160px;">Mã giao dịch:</td>
                        <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${transaction_id || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;">Tổng tiền phòng:</td>
                        <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${formatVND(total_amount)} ₫</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;">Đã đặt cọc (10%):</td>
                        <td style="padding:6px 0;color:#047857;font-size:16px;font-weight:700;">${formatVND(deposit_amount)} ₫</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;">Thời gian thanh toán:</td>
                        <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${payment_date || 'Vừa xong'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- NOTICE -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin:0 0 28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#1e40af;font-size:13px;line-height:1.7;">
                      ℹ️ <strong>Lưu ý:</strong> Vui lòng đến nhận phòng đúng ngày đã đặt. 
                      Số tiền cọc đã thanh toán sẽ được trừ vào tổng hóa đơn khi bạn thanh toán cuối kỳ.
                      Nếu cần hỗ trợ, hãy liên hệ Lễ tân qua ứng dụng InnkeeperHub.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                Trân trọng,<br/>
                <strong style="color:#475569;">Đội ngũ InnkeeperHub</strong>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 48px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © 2025 InnkeeperHub. Đây là email tự động, vui lòng không trả lời.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

// ============================================================
// SEND BOOKING CONFIRMATION EMAIL
// Fire-and-forget: không throw lỗi để không ảnh hưởng webhook
// ============================================================
export const sendBookingConfirmationEmail = async (bookingData) => {
    try {
        const email = bookingData.customer_email || bookingData.guest_email;

        if (!email) {
            console.log('📧 [Email] Bỏ qua gửi email xác nhận — Khách hàng không có địa chỉ email.');
            return null;
        }

        const info = await sendMail({
            to:      email,
            subject: `✅ Xác nhận đặt phòng ${bookingData.booking_code} — InnkeeperHub`,
            html:    buildBookingConfirmationHtml(bookingData),
        });

        console.log(`📧 [Email] Đã gửi email xác nhận đặt phòng tới ${email}`);
        return info;
    } catch (err) {
        // Chỉ log lỗi — không throw để webhook vẫn phản hồi PayOS thành công
        console.error('📧 [Email] Gửi email xác nhận đặt phòng thất bại:', err.message);
        return null;
    }
};
