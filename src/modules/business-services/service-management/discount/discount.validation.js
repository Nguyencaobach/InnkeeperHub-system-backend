import Joi from 'joi';

export const discountSchema = Joi.object({
    // Mã giảm giá: Bắt buộc, tự động cắt khoảng trắng và viết hoa
    code: Joi.string().trim().uppercase().required().messages({
        'string.empty': 'Mã giảm giá không được để trống.',
        'any.required': 'Vui lòng nhập mã giảm giá.'
    }),
    
    // Mô tả: Không bắt buộc
    description: Joi.string().trim().allow(null, '').messages({
        'string.base': 'Mô tả phải là chuỗi văn bản.'
    }),
    
    // Số tiền giảm: Bắt buộc lớn hơn 0
    discount_amount: Joi.number().integer().positive().required().messages({
        'number.base': 'Số tiền giảm phải là một con số.',
        'number.integer': 'Số tiền giảm phải là số nguyên.',
        'number.positive': 'Số tiền giảm phải lớn hơn 0.',
        'any.required': 'Vui lòng nhập số tiền giảm.'
    }),
    
    // Đơn hàng tối thiểu: Mặc định là 0 nếu không nhập
    min_order_value: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'Giá trị đơn hàng tối thiểu phải là con số.',
        'number.min': 'Giá trị đơn hàng tối thiểu không được là số âm.'
    }),
    
    // Giới hạn số lần sử dụng: Không bắt buộc (nếu không nhập thì không giới hạn)
    usage_limit: Joi.number().integer().min(1).allow(null).messages({
        'number.min': 'Giới hạn sử dụng phải từ 1 trở lên.'
    }),
    
    // Ngày bắt đầu: Bắt buộc
    start_date: Joi.date().required().messages({
        'date.base': 'Ngày bắt đầu không đúng định dạng.',
        'any.required': 'Vui lòng chọn ngày bắt đầu.'
    }),
    
    // Ngày kết thúc: Bắt buộc và phải lớn hơn hoặc bằng ngày bắt đầu
    end_date: Joi.date().min(Joi.ref('start_date')).required().messages({
        'date.base': 'Ngày kết thúc không đúng định dạng.',
        'date.min': 'Ngày kết thúc phải lớn hơn hoặc bằng Ngày bắt đầu.',
        'any.required': 'Vui lòng chọn ngày kết thúc.'
    }),
    
    // Trạng thái hoạt động
    is_active: Joi.boolean().default(true)
});