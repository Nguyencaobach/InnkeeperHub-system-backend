import { sendMail } from '../email.service.js';

// ============================================================
// TEMPLATE — Email cấp mật khẩu tạm thời (Quên mật khẩu)
// @param {object} customer - { full_name, username, email }
// @param {string} tempPassword - Mật khẩu tạm thời plain-text
// ============================================================
const buildForgotPasswordHtml = ({ full_name, username }, tempPassword) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đặt lại mật khẩu — InnkeeperHub</title>
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
              <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Cấp lại mật khẩu tạm thời</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 48px;">
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:600;">
                Xin chào, ${full_name}!
              </h2>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${username}</strong>.
                Dưới đây là mật khẩu tạm thời của bạn:
              </p>

              <!-- MẬT KHẨU TẠM THỜI -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:24px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Mật khẩu tạm thời</p>
                    <p style="margin:0;font-size:28px;font-weight:800;color:#0f172a;letter-spacing:4px;font-family:monospace;">${tempPassword}</p>
                  </td>
                </tr>
              </table>

              <!-- HƯỚNG DẪN -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin:0 0 20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;color:#166534;font-size:13px;font-weight:700;">📋 Hướng dẫn sử dụng:</p>
                    <ol style="margin:0;padding-left:20px;color:#15803d;font-size:13px;line-height:1.8;">
                      <li>Mở ứng dụng InnkeeperHub và vào màn hình đăng nhập</li>
                      <li>Nhập tên đăng nhập: <strong>${username}</strong></li>
                      <li>Nhập mật khẩu tạm thời ở trên</li>
                      <li>Sau khi đăng nhập, vào <strong>Hồ sơ → Đổi mật khẩu</strong> để cập nhật mật khẩu mới</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- CẢNH BÁO BẢO MẬT -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin:0 0 28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                      ⚠️ <strong>Lưu ý bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ ngay với chúng tôi — tài khoản của bạn có thể đang bị truy cập trái phép.
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
// SEND FORGOT PASSWORD EMAIL
// @param {object} customer     - { full_name, username, email }
// @param {string} tempPassword - Mật khẩu tạm plain-text để hiển thị trong email
// ============================================================
export const sendForgotPasswordEmail = async (customer, tempPassword) => {
  try {
    await sendMail({
      to: customer.email,
      subject: '🔐 InnkeeperHub — Mật khẩu tạm thời của bạn',
      html: buildForgotPasswordHtml(customer, tempPassword),
    });
  } catch (err) {
    console.error('[Email] Gửi email quên mật khẩu thất bại:', err.message);
    // Re-throw để service biết email gửi thất bại → báo lỗi cho user
    throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
  }
};
