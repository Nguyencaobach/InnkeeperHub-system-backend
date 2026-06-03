import Joi from 'joi';

// ================= SCHEMA CHO THÊM MỚI KHÁCH HÀNG =================
export const createCustomerSchema = Joi.object({
    // 1. CÁC TRƯỜNG BẮT BUỘC
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
    
    // Thêm trường is_active để khi form thêm mới gửi is_active: true lên không bị Joi chặn lại
    is_active: Joi.boolean().default(true),
    
    // 2. CÁC TRƯỜNG TÙY CHỌN (optional + empty('') + allow(null) để bỏ qua khi để trống)
    username: Joi.string().trim().optional().empty('').allow(null).default(null), 
    
    date_of_birth: Joi.date().optional().empty('').allow(null).default(null),
    address: Joi.string().optional().empty('').allow(null).default(null),
    
    phone_number: Joi.string().pattern(/^[0-9]{10,11}$/).optional().empty('').allow(null).default(null).messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 số).'
    }),
    
    avatar_url: Joi.string().optional().empty('').allow(null).default(null),
    
    cccd_number: Joi.string().pattern(/^[0-9]{12}$/).optional().empty('').allow(null).default(null).messages({
        'string.pattern.base': 'Căn cước công dân phải đủ 12 số.'
    }),
    cccd_issue_date: Joi.date().optional().empty('').allow(null).default(null),
    cccd_issue_place: Joi.string().optional().empty('').allow(null).default(null)
});

// ================= SCHEMA CHO CẬP NHẬT KHÁCH HÀNG =================
export const updateCustomerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email không được để trống.',
        'string.email': 'Email không đúng định dạng.'
    }),
    full_name: Joi.string().trim().required().messages({
        'string.empty': 'Họ và tên không được để trống.'
    }),
    
    password: Joi.string().min(6).optional().empty('').allow(null, '').messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự.'
    }),
    
    is_active: Joi.boolean().optional().empty('').allow(null), 
    
    username: Joi.string().trim().optional().empty('').allow(null),

    date_of_birth: Joi.date().optional().empty('').allow(null).default(null),
    address: Joi.string().optional().empty('').allow(null).default(null),
    
    phone_number: Joi.string().pattern(/^[0-9]{10,11}$/).optional().empty('').allow(null).default(null).messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 số).'
    }),
    
    avatar_url: Joi.string().optional().empty('').allow(null).default(null),
    
    cccd_number: Joi.string().pattern(/^[0-9]{12}$/).optional().empty('').allow(null).default(null).messages({
        'string.pattern.base': 'Căn cước công dân phải đủ 12 số.'
    }),
    cccd_issue_date: Joi.date().optional().empty('').allow(null).default(null),
    cccd_issue_place: Joi.string().optional().empty('').allow(null).default(null)
});