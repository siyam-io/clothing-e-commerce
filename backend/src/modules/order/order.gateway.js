import SSLCommerzPayment from "sslcommerz-lts";
import bkashService from "../../services/bkash.service.js";

// FIX Bug 8: Always use fallback so backendUrl is never "undefined"
const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";



export const initiateSSLCommerz = async (order, creds) => {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const store_id = String(creds.storeId || "").trim();
    const store_passwd = String(creds.storePassword || "").trim();
    const is_live = creds.isLive === true || creds.isLive === "true"; 

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    
    const payload = {
        total_amount: order.totalPrice,
        currency: "BDT",
        tran_id: order.paymentResult.transactionId,
        success_url: `${backendUrl}/api/orders/ssl/success/${order.paymentResult.transactionId}`,
        fail_url: `${backendUrl}/api/orders/ssl/fail/${order.paymentResult.transactionId}`,
        cancel_url: `${backendUrl}/api/orders/ssl/cancel/${order.paymentResult.transactionId}`,
        ipn_url: `${backendUrl}/api/orders/ssl/ipn`,
        
        cus_name: order.shippingAddress.name || "Customer",
        cus_email: order.shippingAddress.email || "customer@store.com",
        cus_add1: order.shippingAddress.street || "Dhaka",
        cus_city: order.shippingAddress.city || "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: order.shippingAddress.phone,

        // Shipping Information
        ship_name: order.shippingAddress.name || "Customer",
        ship_add1: order.shippingAddress.street || "Dhaka",
        ship_add2: "N/A",
        ship_city: order.shippingAddress.city || "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: "1000",
        ship_country: "Bangladesh",

        // Product Information
        shipping_method: "Courier",
        product_name: "Apparel Collection",
        product_category: "Clothing",
        product_profile: "general",
    };

    try {
        const res = await sslcz.init(payload);
        if (res?.GatewayPageURL) {
            return res.GatewayPageURL;
        } else {
            console.error(" SSLCommerz API Error:", res?.failedreason);
            throw new Error(res?.failedreason || "SSLCommerz Initialization Failed");
        }
    } catch (err) {
        throw new Error(err.message);
    }
};

export const initiateBkash = async (order, creds) => {
    const callbackURL = `${backendUrl}/api/orders/bkash/success/${order._id}`;
    const res = await bkashService.createPayment(order.totalPrice, order._id.toString(), callbackURL, creds);
    return { url: res.bkashURL, paymentID: res.paymentID };
};

export const handleCODGateway = async (order) => {
    return { url: `${frontendUrl}/payment/success?orderId=${order._id}` };
};