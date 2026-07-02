import Joi from 'joi';

export const updateProfileSchema = Joi.object({
    full_name: Joi.string().trim().required().messages({
        'string.empty': 'Họ tên không được để trống.',
        'any.required': 'Vui lòng nhập họ tên.',
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email không được để trống.',
        'string.email': 'Email không đúng định dạng.',
        'any.required': 'Vui lòng nhập email.'
    }),
    phone_number: Joi.string()
        .pattern(/^[0-9]{9,15}$/)
        .required()
        .messages({ 
            'string.empty': 'Số điện thoại không được để trống.',
            'string.pattern.base': 'Số điện thoại không hợp lệ.',
            'any.required': 'Vui lòng nhập số điện thoại.'
        }),
    password: Joi.string().min(6).optional().empty('').allow(null, '').messages({
        'string.min': 'Mật khẩu mới (nếu có) phải từ 6 ký tự trở lên.'
    }),
});
