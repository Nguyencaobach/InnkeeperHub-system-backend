import Joi from 'joi';

export const loginSchema = Joi.object({
    username: Joi.string()
        .required()
        .messages({
            'string.empty': 'Tên đăng nhập không được để trống.',
            'any.required': 'Trường tên đăng nhập là bắt buộc gửi lên.'
        }),
        
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.empty': 'Mật khẩu không được để trống.',
            'string.min': 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.',
            'any.required': 'Trường mật khẩu là bắt buộc gửi lên.'
        })
});