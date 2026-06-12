import multer from 'multer';
import path from 'path';

// ==========================================
// 1. CẤU HÌNH LƯU ẢNH LOẠI PHÒNG
// ==========================================
const roomStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/rooms/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ==========================================
// 2. CẤU HÌNH LƯU ẢNH SẢN PHẨM
// ==========================================
const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Trỏ luồng lưu file vào thư mục products vừa tạo
        cb(null, 'public/uploads/products/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ==========================================
// 3. CẤU HÌNH LƯU ẢNH DỊCH VỤ ĐI KÈM (MỚI)
// ==========================================
const additionalServiceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/additional-services/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ==========================================
// 4. CẤU HÌNH LƯU ẢNH CCCD (MỚI)
// ==========================================
const cccdStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Trỏ luồng lưu file vào thư mục cccd vừa tạo
        cb(null, 'public/uploads/cccd/');
    },
    filename: function (req, file, cb) {
        // Đặt tên file ngẫu nhiên tránh trùng lặp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // req.fieldname sẽ là 'cccd_front' hoặc 'cccd_back' (do form gửi lên), mình ghép luôn vào tên file cho dễ phân biệt
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ==========================================
// BỘ LỌC CHUNG: Chỉ cho phép file ảnh
// ==========================================
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ được phép upload file ảnh!'), false);
    }
};

// ==========================================
// XUẤT CÁC MIDDLEWARE ĐỂ ROUTER SỬ DỤNG
// ==========================================

// Xuất cho chức năng Loại phòng
export const uploadRoomImage = multer({ 
    storage: roomStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn ảnh 5MB
});

// Xuất cho chức năng Sản phẩm kho
export const uploadProductImage = multer({ 
    storage: productStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn ảnh 5MB
});

// Xuất cho chức năng Dịch vụ đi kèm (MỚI)
export const uploadAdditionalServiceImage = multer({ 
    storage: additionalServiceStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn ảnh 5MB
});

// XUẤT THÊM MIDDLEWARE CHO CCCD
export const uploadCCCDImage = multer({ 
    storage: cccdStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn ảnh 5MB
});