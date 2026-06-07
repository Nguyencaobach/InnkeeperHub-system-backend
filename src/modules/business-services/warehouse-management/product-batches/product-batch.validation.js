import Joi from 'joi';

export const productBatchSchema = Joi.object({
    // Bắt buộc phải truyền ID của sản phẩm mẹ
    product_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required().messages({
        'string.guid': 'Mã sản phẩm không hợp lệ.',
        'string.empty': 'Vui lòng chọn sản phẩm.',
        'any.required': 'Vui lòng chọn sản phẩm.'
    }),
    
    // Mã lô (Để trống cho Backend tự tạo)
    batch_code: Joi.string().trim().empty('').allow(null).messages({
        'string.empty': 'Mã lô hàng không được để trống.',
    }),
    
    // Số lượng ban đầu (Bắt buộc, không âm)
    original_quantity: Joi.number().integer().min(0).required().messages({
        'number.base': 'Số lượng nhập phải là con số.',
        'number.integer': 'Số lượng nhập phải là số nguyên.',
        'number.min': 'Số lượng nhập không được nhỏ hơn 0.',
        'any.required': 'Vui lòng nhập số lượng nhập kho.'
    }),
    
    // Số lượng còn lại (Frontend có thể gửi hoặc không, Service sẽ xử lý tự động = original_quantity)
    remain_quantity: Joi.number().integer().min(0).allow(null),
    
    // Giá nhập
    import_price: Joi.number().integer().min(0).required().messages({
        'number.base': 'Giá nhập phải là con số.',
        'number.min': 'Giá nhập không được là số âm.',
        'any.required': 'Vui lòng nhập giá nhập kho.'
    }),
    
    // Ngày sản xuất
    mfg_date: Joi.date().allow(null, '').messages({
        'date.base': 'Ngày sản xuất không đúng định dạng.'
    }),
    
    // Hạn sử dụng (Phải lớn hơn Ngày sản xuất nhờ hàm greater(Joi.ref('mfg_date')))
    exp_date: Joi.date().allow(null, '').greater(Joi.ref('mfg_date')).messages({
        'date.base': 'Hạn sử dụng không đúng định dạng.',
        'date.greater': 'Hạn sử dụng phải LỚN HƠN Ngày sản xuất.'
    }),
    
    supplier: Joi.string().trim().allow(null, '').messages({
        'string.base': 'Tên nhà cung cấp phải là chuỗi văn bản.'
    }),
    
    status: Joi.string().valid('ACTIVE', 'LOCKED').default('ACTIVE')
});