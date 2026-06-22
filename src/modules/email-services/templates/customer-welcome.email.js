import { sendMail } from '../email.service.js';

// ============================================================
// TEMPLATE — Email chào mừng sau đăng ký thành công
// @param {object} customer - { full_name, username, email }
// ============================================================
const buildWelcomeHtml = ({ full_name, username }) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chào mừng đến với InnkeeperHub</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:40px 48px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;"></div>
              <h1 style="margin:0;color:#f1f5f9;font-size:24px;font-weight:700;letter-spacing:-0.5px;">InnkeeperHub</h1>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Hệ thống quản lý dịch vụ lưu trú</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 48px;">
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:600;">
                Chào mừng bạn, ${full_name}! 🎉
              </h2>
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
                Tài khoản của bạn đã được tạo thành công trên hệ thống <strong>InnkeeperHub</strong>.
                Bạn có thể đăng nhập ngay để đặt phòng, theo dõi lịch sử và tận hưởng những ưu đãi độc quyền dành cho thành viên.
              </p>

              <!-- INFO BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:0 0 28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Thông tin tài khoản</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;color:#64748b;font-size:14px;width:140px;">Tên đăng nhập:</td>
                        <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${username}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#64748b;font-size:14px;">Loại tài khoản:</td>
                        <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">Khách hàng</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- SECURITY NOTE -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin:0 0 28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                      ⚠️ <strong>Lưu ý bảo mật:</strong> Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email hoặc liên hệ với chúng tôi ngay để được hỗ trợ.
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

// ============================================================
// SEND WELCOME EMAIL — Gọi sau khi đăng ký thành công
// Fire-and-forget: không throw lỗi để không ảnh hưởng API chính
// ============================================================
export const sendWelcomeEmail = async (customer) => {
    try {
        await sendMail({
            to:      customer.email,
            subject: '🎉 Chào mừng bạn đến với InnkeeperHub!',
            html:    buildWelcomeHtml(customer),
        });
    } catch (err) {
        // Chỉ log lỗi — không throw để đăng ký vẫn thành công dù email thất bại
        console.error('[Email] Gửi email chào mừng thất bại:', err.message);
    }
};
