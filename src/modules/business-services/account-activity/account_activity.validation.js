import Joi from 'joi';

export const logSchema = Joi.object({
    // user_id và username có thể lấy từ Token tự động, nhưng vẫn cho phép truyền vào
    user_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).allow(null, ''),
    username: Joi.string().allow(null, ''),
    
    // Hành động là bắt buộc (VD: CREATE_ROOM, DELETE_PRODUCT, LOGIN...)
    action: Joi.string().trim().required().messages({
        'string.empty': 'Hành động (action) không được để trống.',
        'any.required': 'Vui lòng cung cấp hành động.'
    }),
    
    // Phân loại đối tượng bị tác động (VD: ROOM, PRODUCT, USER)
    entity_type: Joi.string().trim().allow(null, ''),
    
    // Tên của đối tượng bị tác động (VD: Phòng VIP 101, Nước suối...)
    entity_name: Joi.string().trim().allow(null, ''),
    
    // Chi tiết (Lưu dưới dạng JSON Object)
    details: Joi.object().allow(null).messages({
        'object.base': 'Chi tiết (details) phải là một đối tượng JSON.'
    })
});