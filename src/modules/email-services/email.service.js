import nodemailer from 'nodemailer';

// ============================================================
// TRANSPORTER — Kết nối tới dịch vụ SMTP
// Cấu hình qua biến môi trường trong .env
//
// Ví dụ .env cho Gmail:
//   EMAIL_HOST=smtp.gmail.com
//   EMAIL_PORT=587
//   EMAIL_USER=your_email@gmail.com
//   EMAIL_PASS=your_app_password   ← App Password (không phải mật khẩu Google)
//   EMAIL_FROM="InnkeeperHub" <your_email@gmail.com>
// ============================================================
const createTransporter = () =>
    nodemailer.createTransport({
        host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
        port:   Number(process.env.EMAIL_PORT) || 587,
        secure: false, // false = STARTTLS (port 587), true = SSL (port 465)
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

// ============================================================
// SEND MAIL — Hàm gửi email tổng quát
// @param {string} to      - Địa chỉ email người nhận
// @param {string} subject - Tiêu đề email
// @param {string} html    - Nội dung HTML
// ============================================================
export const sendMail = async ({ to, subject, html }) => {
    const transporter = createTransporter();
    const from = process.env.EMAIL_FROM || `"InnkeeperHub" <${process.env.EMAIL_USER}>`;

    const info = await transporter.sendMail({ from, to, subject, html });
    console.log(`📧 [Email] Đã gửi tới ${to} — MessageId: ${info.messageId}`);
    return info;
};
