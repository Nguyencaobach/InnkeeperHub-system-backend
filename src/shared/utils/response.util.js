// Khai báo một "Từ điển" mã lỗi để dùng chung, khỏi phải nhớ số
export const STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500
};

// Hàm trả về thành công
export const sendSuccess = (res, data = null, message = "Thành công", statusCode = STATUS_CODES.OK) => {
    return res.status(statusCode).json({
        success: true,
        message: message,
        data: data
    });
};

// Hàm trả về báo lỗi
export const sendError = (res, message = "Lỗi hệ thống", statusCode = STATUS_CODES.INTERNAL_ERROR, errors = null) => {
    return res.status(statusCode).json({
        success: false,
        message: message,
        errors: errors 
    });
};