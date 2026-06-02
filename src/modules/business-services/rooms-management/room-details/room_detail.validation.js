import Joi from 'joi';

export const roomDetailSchema = Joi.object({
    // Bắt buộc phải có ID của loại phòng và phải đúng định dạng UUID
    room_type_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required().messages({
        'string.guid': 'Mã loại phòng phải là định dạng UUID hợp lệ.',
        'string.empty': 'Mã loại phòng không được để trống.',
        'any.required': 'Vui lòng chọn loại phòng.'
    }),
    
    // Tên/Số phòng (VD: P101) không được để trống, .trim() để tự động cắt khoảng trắng 2 đầu
    room_number: Joi.string().trim().required().messages({
        'string.empty': 'Số phòng/Tên phòng không được để trống.',
        'any.required': 'Vui lòng nhập số phòng (Ví dụ: P101).'
    }),
    
    // Trạng thái chỉ cho phép 4 chữ này, nếu không truyền lên thì mặc định là AVAILABLE
    status: Joi.string().valid('AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE').default('AVAILABLE').messages({
        'any.only': 'Trạng thái phòng chỉ được là: AVAILABLE, OCCUPIED, CLEANING, hoặc MAINTENANCE.'
    })
});