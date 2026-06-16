import Joi from 'joi';

// =============================================
// SCHEMA CẬP NHẬT HỒ SƠ CÁ NHÂN
// =============================================
export const updateProfileSchema = Joi.object({
    full_name: Joi.string().trim().required().messages({
        'string.empty': 'Họ và tên không được để trống.',
        'any.required': 'Vui lòng nhập họ và tên.',
    }),

    email: Joi.string().email().optional().empty('').allow(null).messages({
        'string.email': 'Email không đúng định dạng.',
    }),

    phone_number: Joi.string()
        .pattern(/^[0-9]{10,11}$/)
        .optional().empty('').allow(null)
        .messages({ 'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 số).' }),

    gender: Joi.string().valid('NAM', 'NU', 'KHAC').optional().empty('').allow(null),

    permanent_address: Joi.string().optional().empty('').allow(null),

    // Đổi mật khẩu: tùy chọn, nếu có thì phải >= 6 ký tự
    password: Joi.string().min(6).optional().empty('').allow(null, '').messages({
        'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự.',
    }),
});

// =============================================
// SCHEMA CẬP NHẬT THÔNG TIN DOANH NGHIỆP
// =============================================
export const updateBusinessSchema = Joi.object({
    business_name: Joi.string().trim().required().messages({
        'string.empty': 'Tên doanh nghiệp không được để trống.',
        'any.required': 'Vui lòng nhập tên doanh nghiệp.',
    }),

    business_type: Joi.string().optional().empty('').allow(null),
    tax_code: Joi.string().optional().empty('').allow(null),
    legal_representative: Joi.string().optional().empty('').allow(null),
    business_address: Joi.string().optional().empty('').allow(null),
    logo_url: Joi.string().uri().optional().empty('').allow(null).messages({
        'string.uri': 'URL Logo không đúng định dạng.',
    }),

    bank_account_number: Joi.string().optional().empty('').allow(null),
    bank_name: Joi.string().optional().empty('').allow(null),
    bank_account_name: Joi.string().optional().empty('').allow(null),

    hotline: Joi.string().optional().empty('').allow(null),
    email_contact: Joi.string().email().optional().empty('').allow(null).messages({
        'string.email': 'Email liên hệ không đúng định dạng.',
    }),
});
