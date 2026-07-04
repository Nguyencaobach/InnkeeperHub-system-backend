// src/shared/services/aiverify.service.js
// Service gọi Python AI Server (localhost:8000) để xác thực ảnh CCCD
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

/**
 * Xác thực ảnh CCCD qua Python AI Server
 * @param {string} filePath  - Đường dẫn tuyệt đối tới file ảnh
 * @param {string} side      - "front" | "back"
 * @param {string} userName  - Tên user từ DB để so sánh với tên trên CCCD (chỉ cần cho mặt trước)
 * @returns {{ valid: boolean, message: string }}
 */
export const verifyCCCDImage = async (filePath, side, userName = '') => {
    const sideName = side === 'front' ? 'mặt trước' : 'mặt sau';

    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('side', side);

        // Truyền tên user để Python so sánh với tên trên CCCD (chỉ mặt trước)
        if (side === 'front' && userName && userName.trim()) {
            form.append('user_name', userName.trim());
        }

        const response = await axios.post(
            `${AI_SERVER_URL}/verify-cccd`,
            form,
            {
                headers: { ...form.getHeaders() },
                timeout: 45000, // 45s — OCR + name matching cần thêm thời gian
            }
        );

        // Python trả về { is_valid, side, message }
        if (response.data.is_valid) {
            console.log(`✅ [AI Server] Ảnh ${sideName} CCCD hợp lệ`);
            return { valid: true, message: response.data.message };
        }

        return { valid: false, message: response.data.message || `Ảnh ${sideName} không hợp lệ` };

    } catch (error) {
        // Python trả về lỗi qua HTTP 400/500 với field "detail"
        if (error.response) {
            const detail = error.response.data?.detail || `Ảnh ${sideName} CCCD không hợp lệ`;
            console.warn(`⚠️ [AI Server] Từ chối ảnh ${sideName}: ${detail}`);
            return { valid: false, message: detail };
        }

        // Lỗi kết nối (AI server chưa bật, timeout...)
        console.error(`⚠️ [AI Server] Không thể kết nối: ${error.message}`);
        console.warn(`⚠️ [AI Server] Bỏ qua kiểm tra ảnh ${sideName} (server AI không khả dụng)`);

        // Fallback: cho pass để không chặn user khi AI server down
        return { valid: true, message: 'Bỏ qua kiểm tra (AI server không phản hồi)' };
    }
};
