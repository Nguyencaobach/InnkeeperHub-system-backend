import Joi from 'joi';

export const bookingSchema = Joi.object({
    room_type_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required().messages({
        'any.required': 'Lỗi: Thiếu ID Loại phòng.'
    }),
    room_detail_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required().messages({
        'any.required': 'Lỗi: Thiếu ID Phòng chi tiết.'
    }),
    
    // Thông tin khách hàng
    guest_name: Joi.string().trim().required().messages({
        'string.empty': 'Vui lòng nhập họ tên khách hàng.'
    }),
    guest_phone: Joi.string().trim().required().messages({
        'string.empty': 'Vui lòng nhập số điện thoại.'
    }),
    guest_email: Joi.string().email().allow(null, '').messages({
        'string.email': 'Email không đúng định dạng.'
    }),

    // Thông tin phiên thuê
    rent_type: Joi.string().valid('HOURLY', 'DAILY').required().messages({
        'any.only': 'Hình thức thuê chỉ được là HOURLY hoặc DAILY.'
    }),
    expected_checkin: Joi.date().required().messages({
        'any.required': 'Vui lòng nhập giờ check-in dự kiến.'
    }),
    expected_checkout: Joi.date().allow(null, ''), // Không bắt buộc
    
    // Tài chính (formData sẽ gửi lên dạng chuỗi, convert: true trong middleware sẽ ép về số)
    total_amount: Joi.number().min(0).default(0),
    deposit_amount: Joi.number().min(0).default(0)
});