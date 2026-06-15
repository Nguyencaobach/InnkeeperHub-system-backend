import {
    fetchProductsByCategoryWithStock,
    fetchServiceItemsByBookingId,
    addInventoryItemToBooking,
    removeServiceItem,
    fetchServiceCategories,
    fetchServicesByCategoryName,
    addGeneralServiceToBooking,
} from './booking-service-item.model.js';

// Lấy sản phẩm theo danh mục kèm tồn kho hợp lệ
export const getProductsByCategoryService = async (categoryId) => {
    if (!categoryId) throw new Error('Thiếu categoryId.');
    return await fetchProductsByCategoryWithStock(categoryId);
};

// Lấy danh sách dịch vụ/hàng hóa đã gọi của 1 phiên thuê
export const getServiceItemsService = async (bookingId) => {
    return await fetchServiceItemsByBookingId(bookingId);
};

// Thêm hàng kho vào phiên thuê (FEFO — ưu tiên lô gần hết hạn nhất)
export const addInventoryItemService = async (bookingId, { product_id, quantity }) => {
    if (!product_id) throw new Error('Thiếu product_id.');
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) throw new Error('Số lượng không hợp lệ.');
    return await addInventoryItemToBooking({ bookingId, productId: product_id, quantity: qty });
};

// Xóa 1 item khỏi phiên thuê (tự động hoàn tồn kho nếu là INVENTORY)
export const removeServiceItemService = async (serviceItemId) => {
    return await removeServiceItem(serviceItemId);
};

// Lấy các category dịch vụ đi kèm (DISTINCT)
export const getServiceCategoriesService = async () => {
    return await fetchServiceCategories();
};

// Lấy dịch vụ theo category
export const getServicesByCategoryService = async (category) => {
    if (!category) throw new Error('Thiếu category.');
    return await fetchServicesByCategoryName(category);
};

// Thêm dịch vụ đi kèm vào phiên thuê
export const addGeneralServiceService = async (bookingId, body) => {
    const { service_id, quantity = 1 } = body;
    if (!service_id) throw new Error('Thiếu service_id.');
    // Lấy thông tin dịch vụ từ body (frontend gửi kèm name + price + unit)
    const { service_name, price, unit } = body;
    return await addGeneralServiceToBooking({
        bookingId,
        serviceId: service_id,
        serviceName: service_name,
        price: parseInt(price, 10),
        quantity: parseInt(quantity, 10),
        unit,
    });
};
