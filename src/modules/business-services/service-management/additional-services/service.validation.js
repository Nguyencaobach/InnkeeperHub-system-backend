import Joi from 'joi';

export const serviceSchema = Joi.object({
    // Danh mục dịch vụ (VD: LAUNDRY, FB...)
    category: Joi.string().trim().required().messages({
        'string.empty': 'Vui lòng chọn danh mục dịch vụ.',
        'any.required': 'Danh mục dịch vụ không được để trống.'
    }),
    
    // Tên dịch vụ
    name: Joi.string().trim().required().messages({
        'string.empty': 'Tên dịch vụ không được để trống.',
        'any.required': 'Vui lòng nhập tên dịch vụ.'
    }),
    
    // Đơn vị tính (VD: Kg, Lần, Ly...)
    unit: Joi.string().trim().required().messages({
        'string.empty': 'Đơn vị tính không được để trống.',
        'any.required': 'Vui lòng nhập đơn vị tính.'
    }),
    
    // Giá tiền: Bắt buộc từ 0 trở lên
    price: Joi.number().integer().min(0).required().messages({
        'number.base': 'Giá dịch vụ phải là một con số.',
        'number.integer': 'Giá dịch vụ phải là số nguyên.',
        'number.min': 'Giá dịch vụ không được là số âm.',
        'any.required': 'Vui lòng nhập giá dịch vụ.'
    }),
    
    // Mô tả: Cho phép rỗng
    description: Joi.string().trim().allow(null, '').messages({
        'string.base': 'Mô tả phải là văn bản.'
    }),
    
    // Trạng thái hoạt động
    is_active: Joi.boolean().default(true)
});