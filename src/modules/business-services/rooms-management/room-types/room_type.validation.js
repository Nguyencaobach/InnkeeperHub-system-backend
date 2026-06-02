import Joi from 'joi';

export const roomTypeSchema = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'Tên loại phòng không được để trống.',
        'any.required': 'Vui lòng nhập tên loại phòng.'
    }),
    
    // Thêm .integer() để chặn số thập phân (Ví dụ: 10.5)
    hourly_price: Joi.number().integer().min(0).required().messages({
        'number.base': 'Giá theo giờ phải là một con số.',
        'number.integer': 'Giá theo giờ phải là số nguyên (không chứa dấu thập phân).',
        'number.min': 'Giá theo giờ không được là số âm.',
        'any.required': 'Vui lòng nhập giá theo giờ.'
    }),
    
    // Thêm .integer()
    daily_price: Joi.number().integer().min(0).required().messages({
        'number.base': 'Giá theo ngày phải là một con số.',
        'number.integer': 'Giá theo ngày phải là số nguyên.',
        'number.min': 'Giá theo ngày không được là số âm.',
        'any.required': 'Vui lòng nhập giá theo ngày.'
    }),
    
    floor: Joi.string().allow('', null),
    
    // Sức chứa và diện tích cũng nên là số nguyên
    capacity: Joi.number().integer().min(1).default(2).messages({
        'number.base': 'Sức chứa phải là một con số.'
    }),
    bed_type: Joi.string().allow('', null),
    room_size: Joi.number().integer().min(1).allow(null),
    
    view_type: Joi.string().allow('', null),
    amenities: Joi.any().allow('', null) 
});