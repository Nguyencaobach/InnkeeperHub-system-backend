import {
    findCustomerByUsername,
    checkCustomerExists,
    createCustomer,
    findCustomerByEmail,
    updateCustomerPassword,
} from './auth.model.js';
import { comparePassword, hashPassword } from '../../../shared/utils/hash.util.js';
import { generateToken } from '../../../shared/utils/jwt.util.js';
import { sendWelcomeEmail } from '../../email-services/templates/customer-welcome.email.js';
import { sendForgotPasswordEmail } from '../../email-services/templates/customer-forgot-password.email.js';

// Tạo mật khẩu tạm ngẫu nhiên (8 ký tự: chữ hoa + chữ thường + số)
const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// ============================================================
// REGISTER — Đăng ký tài khoản customer
// ============================================================
export const registerLogic = async ({ username, password, full_name, email, phone_number }) => {
    // 1. Kiểm tra trùng lặp username / email / phone
    const dup = await checkCustomerExists(username, email, phone_number);

    if (dup.username_taken) throw new Error('Tên đăng nhập đã được sử dụng.');
    if (dup.email_taken)    throw new Error('Email đã được đăng ký.');
    if (dup.phone_taken)    throw new Error('Số điện thoại đã được đăng ký.');

    // 2. Hash mật khẩu trước khi lưu — tuyệt đối không lưu plain-text
    const hashedPassword = await hashPassword(password);

    // 3. Tạo tài khoản trong DB
    const newCustomer = await createCustomer({
        username,
        password: hashedPassword,
        full_name,
        email,
        phone_number,
    });

    // 4. Gửi email chào mừng — Fire-and-forget (không throw lỗi, không chặn response)
    sendWelcomeEmail(newCustomer);

    return newCustomer;
};

// ============================================================
// LOGIN — Đăng nhập và cấp access token
// ============================================================
export const loginLogic = async (username, password) => {
    // 1. Tìm customer trong Database — trả null nếu không tồn tại hoặc đã bị khóa
    const customer = await findCustomerByUsername(username);

    // Báo lỗi gộp chung để hacker không biết là sai username hay tài khoản bị khóa
    if (!customer) {
        throw new Error('Tài khoản không tồn tại hoặc đã bị khóa.');
    }

    // 2. So sánh mật khẩu khách gửi và mật khẩu hash trong DB
    const isPasswordMatch = await comparePassword(password, customer.password);
    if (!isPasswordMatch) {
        throw new Error('Mật khẩu không chính xác.');
    }

    // 3. Tạo access token — nhúng thông tin cần thiết để các API sau xác thực
    const token = generateToken({
        id:           customer.customer_id,
        customer_id:  customer.customer_id,
        username:     customer.username,
        full_name:    customer.full_name,
        role:         'customer',                // Vai trò cố định cho phân quyền
    });

    // 4. Xóa password trước khi trả về Frontend
    const { password: _pw, ...customerInfo } = customer;

    return {
        customer: customerInfo,
        accessToken: token,
    };
};

// ============================================================
// FORGOT PASSWORD — Tạo mật khẩu tạm, lưu DB và gửi email cho customer
// ============================================================
export const forgotPasswordLogic = async (email) => {
    // 1. Tìm customer theo email — chỉ chấp nhận tài khoản đang hoạt động
    const customer = await findCustomerByEmail(email);

    if (!customer) {
        // Bảo mật: không tiết lộ email có tồn tại hay không
        throw new Error('Nếu email tồn tại trong hệ thống, mật khẩu tạm thời sẽ được gửi đến hộp thư của bạn.');
    }

    // 2. Tạo mật khẩu tạm thời ngẫu nhiên (plain-text để gửi mail)
    const tempPassword = generateTempPassword();

    // 3. Hash và lưu vào DB — thay thế mật khẩu cũ
    const hashedPassword = await hashPassword(tempPassword);
    await updateCustomerPassword(customer.customer_id, hashedPassword);

    // 4. Gửi email chứa mật khẩu tạm (có throw nếu gửi thất bại)
    await sendForgotPasswordEmail(customer, tempPassword);

    return { message: 'Mật khẩu tạm thời đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.' };
};
