import Joi from 'joi';

// ============================================================
// SCHEMA — Đăng ký tài khoản mới
// ============================================================
export const registerSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Tên đăng nhập không được để trống.',
            'string.min':   'Tên đăng nhập phải có ít nhất 3 ký tự.',
            'string.max':   'Tên đăng nhập không được vượt quá 100 ký tự.',
            'any.required': 'Trường tên đăng nhập là bắt buộc.'
        }),

    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.empty': 'Mật khẩu không được để trống.',
            'string.min':   'Mật khẩu phải có ít nhất 6 ký tự.',
            'any.required': 'Trường mật khẩu là bắt buộc.'
        }),

    full_name: Joi.string()
        .max(100)
        .required()
        .messages({
            'string.empty': 'Họ và tên không được để trống.',
            'string.max':   'Họ và tên không được vượt quá 100 ký tự.',
            'any.required': 'Trường họ và tên là bắt buộc.'
        }),

    email: Joi.string()
        .email()
        .max(100)
        .required()
        .messages({
            'string.empty': 'Email không được để trống.',
            'string.email': 'Email không đúng định dạng.',
            'string.max':   'Email không được vượt quá 100 ký tự.',
            'any.required': 'Trường email là bắt buộc.'
        }),

    phone_number: Joi.string()
        .pattern(/^[0-9]{9,15}$/)
        .required()
        .messages({
            'string.empty':   'Số điện thoại không được để trống.',
            'string.pattern.base': 'Số điện thoại chỉ gồm 9–15 chữ số.',
            'any.required':   'Trường số điện thoại là bắt buộc.'
        }),
});

// ============================================================
// SCHEMA — Đăng nhập
// ============================================================
export const loginSchema = Joi.object({
    username: Joi.string()
        .required()
        .messages({
            'string.empty': 'Tên đăng nhập không được để trống.',
            'any.required': 'Trường tên đăng nhập là bắt buộc.'
        }),

    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.empty': 'Mật khẩu không được để trống.',
            'string.min':   'Mật khẩu phải có ít nhất 6 ký tự.',
            'any.required': 'Trường mật khẩu là bắt buộc.'
        }),
});

// ============================================================
// SCHEMA — Quên mật khẩu (bước 1: nhập email)
// ============================================================
export const forgotPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Email không được để trống.',
            'string.email': 'Email không đúng định dạng.',
            'any.required': 'Trường email là bắt buộc.'
        }),
});

// ============================================================
// SCHEMA — Đặt lại mật khẩu (bước 2: nhập mật khẩu mới)
// ============================================================
export const resetPasswordSchema = Joi.object({
    reset_token: Joi.string()
        .required()
        .messages({
            'string.empty': 'Token đặt lại mật khẩu không được để trống.',
            'any.required': 'Trường reset_token là bắt buộc.'
        }),

    new_password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.empty': 'Mật khẩu mới không được để trống.',
            'string.min':   'Mật khẩu mới phải có ít nhất 6 ký tự.',
            'any.required': 'Trường mật khẩu mới là bắt buộc.'
        }),
});
