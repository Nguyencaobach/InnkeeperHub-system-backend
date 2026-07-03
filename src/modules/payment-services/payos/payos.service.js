import { PayOS } from '@payos/node';

// Lấy thông tin từ biến môi trường
const clientId = process.env.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY;
const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

// Kiểm tra biến môi trường
if (!clientId || !apiKey || !checksumKey) {
  console.warn('PayOS keys are missing in .env file. Please check PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY');
}

// Khởi tạo PayOS (SDK v2)
const payos = new PayOS({
    clientId: clientId || 'dummy',
    apiKey: apiKey || 'dummy',
    checksumKey: checksumKey || 'dummy'
});

/**
 * Tạo link thanh toán PayOS
 * @param {Object} paymentData Thông tin thanh toán (orderCode, amount, description, cancelUrl, returnUrl)
 * @returns {Promise<Object>} URL thanh toán hoặc QR code data
 */
export const createPaymentLink = async (paymentData) => {
    try {
        const body = {
            orderCode: paymentData.orderCode,
            amount: paymentData.amount,
            description: paymentData.description,
            cancelUrl: paymentData.cancelUrl || 'http://localhost:3000/cancel',
            returnUrl: paymentData.returnUrl || 'http://localhost:3000/success',
        };
        // Sử dụng phương thức của SDK v2
        const paymentLink = await payos.paymentRequests.create(body);
        return paymentLink;
    } catch (error) {
        console.error('PayOS Create Payment Link Error:', error);
        throw error;
    }
};

/**
 * Xác thực dữ liệu Webhook từ PayOS
 * @param {Object} webhookBody 
 * @returns {Object} Webhook Data đã được verify
 */
export const verifyWebhookData = (webhookBody) => {
    try {
        // SDK v2 verify qua webhooks.verify
        const webhookData = payos.webhooks.verify(webhookBody);
        return webhookData;
    } catch (error) {
        console.error('PayOS Verify Webhook Error:', error);
        throw error;
    }
};

