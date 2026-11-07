// src/modules/order/validators/order.validator.js
import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const shippingAddressSchema = z.object({
    name: z.string().min(2, "Name is too short"),
    email: z.string().email("Invalid email format").optional().or(z.literal("")), // Optional email
    phone: z.string().min(8, "Invalid phone number"),
    address: z.string().min(2, "Address is too short"),
});

const orderItemSchema = z.object({
    product: z.string().regex(objectIdRegex, "Invalid product ID"),
    size: z.string().nullable().optional(), // More flexible for products without sizes
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const initPaymentSchema = z.object({
    orderItems: z.array(orderItemSchema).min(1, "Order must have at least one item"),
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.enum(['ssl', 'bkash', 'cod']).optional().default('ssl'),
    couponCode: z.string().optional(),
    isDirectBuy: z.boolean().optional().default(false),
});

export const adminCreateOrderSchema = z.object({
    user: z.string().regex(objectIdRegex).optional().nullable(),
    orderItems: z.array(orderItemSchema).min(1),
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.string().optional().default('Cash'),
    orderStatus: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']).optional().default('Delivered'),
    paymentStatus: z.enum(['Pending', 'Completed', 'Failed', 'Cancelled', 'COD']).optional().default('Completed'),
    couponCode: z.string().optional(),
    shippingPrice: z.number().min(0).optional(),
    deliveryZone: z.string().optional(),
    discountAmount: z.number().min(0).optional(),
});

export const adminUpdateOrderSchema = z.object({
    orderItems: z.array(orderItemSchema).optional(),
    shippingAddress: shippingAddressSchema.partial().optional(),
    orderStatus: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']).optional(),
    paymentMethod: z.enum(['COD', 'SSLCommerz', 'bKash']).optional(),
    paymentResult: z.object({
        status: z.enum(['Pending', 'Completed', 'Failed', 'Cancelled', 'COD']).optional(),
        transactionId: z.string().optional(),
    }).optional(),
});
