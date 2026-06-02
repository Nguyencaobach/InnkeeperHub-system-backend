import Joi from 'joi';

// ================= SCHEMA CHO THÊM MỚI NHÂN VIÊN =================
export const createStaffSchema = Joi.object({
    // Các trường bắt buộc
    email: Joi.string().email().required().messages({
        'string.empty': 'Email không được để trống.',
        'string.email': 'Email không đúng định dạng.',
        'any.required': 'Vui lòng nhập email.'
    }),
    full_name: Joi.string().trim().required().messages({
        'string.empty': 'Họ và tên không được để trống.',
        'any.required': 'Vui lòng nhập họ và tên.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Mật khẩu không được để trống.',
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự.',
        'any.required': 'Vui lòng nhập mật khẩu.'
    }),
    
    // Các trường tùy chọn (Backend sẽ tự xử lý mặc định nếu không gửi)
    username: Joi.string().trim().allow('', null), // Sẽ tự sinh từ email nếu để trống
    role: Joi.string().valid('ADMIN', 'MANAGER', 'STAFF').default('STAFF'),
    
    gender: Joi.string().valid('NAM', 'NU', 'KHAC').allow('', null),
    date_of_birth: Joi.date().allow('', null),
    phone_number: Joi.string().pattern(/^[0-9]{10,11}$/).allow('', null).messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 số).'
    }),
    permanent_address: Joi.string().allow('', null),
    
    cccd_number: Joi.string().pattern(/^[0-9]{12}$/).allow('', null).messages({
        'string.pattern.base': 'Căn cước công dân phải đủ 12 số.'
    }),
    cccd_issue_date: Joi.date().allow('', null),
    cccd_issue_place: Joi.string().allow('', null),

    // Thông tin ngân hàng (Tùy chọn, cập nhật sau cũng được)
    bank_name: Joi.string().allow('', null),
    bank_account_number: Joi.string().allow('', null),
    bank_account_name: Joi.string().allow('', null)
});

// ================= SCHEMA CHO CẬP NHẬT NHÂN VIÊN =================
export const updateStaffSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email không được để trống.',
        'string.email': 'Email không đúng định dạng.'
    }),
    full_name: Joi.string().trim().required().messages({
        'string.empty': 'Họ và tên không được để trống.'
    }),
    
    // Khi update, password được phép để trống (không đổi pass)
    password: Joi.string().min(6).allow('', null).messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự.'
    }),
    
    role: Joi.string().valid('ADMIN', 'MANAGER', 'STAFF').allow('', null),
    is_active: Joi.boolean(), // Cho phép gửi lệnh khóa/mở khóa tài khoản
    
    gender: Joi.string().valid('NAM', 'NU', 'KHAC').allow('', null),
    date_of_birth: Joi.date().allow('', null),
    phone_number: Joi.string().pattern(/^[0-9]{10,11}$/).allow('', null).messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ.'
    }),
    permanent_address: Joi.string().allow('', null),
    
    cccd_number: Joi.string().pattern(/^[0-9]{12}$/).allow('', null).messages({
        'string.pattern.base': 'Căn cước công dân phải đủ 12 số.'
    }),
    cccd_issue_date: Joi.date().allow('', null),
    cccd_issue_place: Joi.string().allow('', null),

    bank_name: Joi.string().allow('', null),
    bank_account_number: Joi.string().allow('', null),
    bank_account_name: Joi.string().allow('', null)
});