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
    const ext = path.extname(file.originalname).toLowerCase();
    const isImageExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.bmp'].includes(ext);
    if (file.mimetype.startsWith('image/') || isImageExt) {
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

// ==========================================
// 5. CẤU HÌNH LƯU ẢNH AVATAR NHÂN VIÊN
// ==========================================
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/avatar/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Xuất cho chức năng Avatar nhân viên
export const uploadAvatarImage = multer({ 
    storage: avatarStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 } // Giới hạn 3MB cho avatar
});

// ==========================================
// 6. CẤU HÌNH LƯU ẢNH AVATAR KHÁCH HÀNG (CUSTOMER)
// ==========================================
const customerAvatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/customer-avatar/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'customer-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Xuất cho chức năng Avatar Khách hàng
export const uploadCustomerAvatar = multer({ 
    storage: customerAvatarStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 } // Giới hạn 3MB
});