import mongoose from 'mongoose';
import Product from '../product.model.js';
import Order from '../../order/order.model.js';
import Category from '../../category/category.model.js';
import { asyncHandler } from '../../../middleware/asyncHandler.js';
import { clearCache } from '../../../middleware/cacheMiddleware.js';
import { uploadMultipleImages, deleteImage, uploadImage } from '../../../services/imageUploadService.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';
import { ZodError } from 'zod';
import auditLogService from '../../auditLog/auditLog.service.js';

// Helper to parse product data
const parseProductData = (req) => {
    const body = req.body;
    const parsedData = {};

    if (body.name !== undefined) {
        parsedData.name = body.name;
        if (!body.slug || body.slug === 'undefined') {
            parsedData.slug = body.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        }
    }
    if (body.slug !== undefined && body.slug !== 'undefined') parsedData.slug = body.slug;
    if (body.description !== undefined) parsedData.description = body.description;
    if (body.price !== undefined) parsedData.price = parseFloat(body.price);
    if (body.discount !== undefined) parsedData.discount = parseFloat(body.discount);
    if (body.featuredOrder !== undefined) parsedData.featuredOrder = parseInt(body.featuredOrder);
    if (body.isActive !== undefined) parsedData.isActive = body.isActive === 'true' || body.isActive === true;
    if (body.isFeatured !== undefined) parsedData.isFeatured = body.isFeatured === 'true' || body.isFeatured === true;
    if (body.showReviews !== undefined) parsedData.showReviews = body.showReviews === 'true' || body.showReviews === true;
    if (body.category !== undefined) parsedData.category = body.category;
    if (body.subcategory !== undefined) {
        parsedData.subcategory = (body.subcategory === 'undefined' || body.subcategory === 'null' || !body.subcategory) ? null : body.subcategory;
    }
    if (body.tags) {
        try {
            parsedData.tags = typeof body.tags === 'string' ? JSON.parse(body.tags) : body.tags;
        } catch (e) {
            parsedData.tags = body.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
    }
    if (body.sizes) {
        try {
            const sizes = typeof body.sizes === 'string' ? JSON.parse(body.sizes) : body.sizes;
            parsedData.sizes = sizes.map(s => ({
                size: s.size._id || s.size,
                stock: Math.max(0, parseInt(s.stock))
            }));
        } catch (e) { console.error("Size parsing error"); }
    }
    if (body.sku !== undefined) parsedData.sku = body.sku === 'null' || body.sku === 'undefined' || !body.sku ? null : body.sku;
    if (body.gtin !== undefined) parsedData.gtin = body.gtin === 'null' || body.gtin === 'undefined' || !body.gtin ? null : body.gtin;
    if (body.brand !== undefined) parsedData.brand = body.brand === 'null' || body.brand === 'undefined' || !body.brand ? null : body.brand;
    if (body.material !== undefined) parsedData.material = body.material === 'null' || body.material === 'undefined' || !body.material ? null : body.material;
    if (body.color !== undefined) parsedData.color = body.color === 'null' || body.color === 'undefined' || !body.color ? null : body.color;
    if (body.gender !== undefined) parsedData.gender = body.gender === 'null' || body.gender === 'undefined' || !body.gender ? 'Unisex' : body.gender;
    if (body.specifications !== undefined) {
        try {
            parsedData.specifications = typeof body.specifications === 'string' ? JSON.parse(body.specifications) : body.specifications;
        } catch (e) { console.error("specifications parsing error"); }
    }
    if (body.faqs !== undefined) {
        try {
            parsedData.faqs = typeof body.faqs === 'string' ? JSON.parse(body.faqs) : body.faqs;
        } catch (e) { console.error("faqs parsing error"); }
    }
    if (body.seo !== undefined) {
        try {
            parsedData.seo = typeof body.seo === 'string' ? JSON.parse(body.seo) : body.seo;
        } catch (e) { console.error("seo parsing error"); }
    }
    return parsedData;
};

const handleZodError = (error, res) => {
    const formattedErrors = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
    }));
    return res.status(400).json({ errors: formattedErrors });
};

export const createProduct = asyncHandler(async (req, res) => {
    let imageUrls = [];
    if (req.files && req.files.length) {
        imageUrls = await uploadMultipleImages(req.files, 'products');
    }
    const parsedData = parseProductData(req);
    parsedData.images = imageUrls;

    try {
        const validatedData = createProductSchema.parse(parsedData);
        const product = await Product.create(validatedData);
        
        // Clear caches
        clearCache('cache:/api/products*');
        clearCache('cache:/api/home-layout*');
        clearCache('cache:/api/flash-sales*');
        clearCache('cache:/api/admin/dashboard*');

        auditLogService.recordLog({
            req,
            action: "CREATE",
            module: "Product",
            resourceId: product._id,
            resourceName: product.name,
            description: `Created new product: "${product.name}" (৳${product.price})`,
            details: { price: product.price, category: product.category, slug: product.slug },
        });

        res.status(201).json(product);
    } catch (error) {
        if (imageUrls.length) await Promise.all(imageUrls.map(url => deleteImage(url)));
        if (error instanceof ZodError) return handleZodError(error, res);
        throw error;
    }
});

export const getAdminProducts = asyncHandler(async (req, res) => {
    const {
        category,
        search,
        minPrice,
        maxPrice,
        sort,
        page = 1,
        limit = 30,
        isActive,
        stockStatus,
        isFeatured,
        subcategory,
        flashSale,
    } = req.query;

    const matchStage = {};

    // Admin filtering: show all by default unless specified
    if (isActive === 'false') matchStage.isActive = false;
    else if (isActive === 'true') matchStage.isActive = true;

    // Separate Featured filter from category query if provided directly
    if (isFeatured === 'true') matchStage.isFeatured = true;

    if (flashSale && flashSale !== 'all' && mongoose.Types.ObjectId.isValid(flashSale)) {
        const sale = await mongoose.model("FlashSale").findById(flashSale);
        if (sale && sale.products && sale.products.length > 0) {
            matchStage._id = { $in: sale.products.map(id => new mongoose.Types.ObjectId(id)) };
        } else {
            matchStage._id = new mongoose.Types.ObjectId();
        }
    }

    if (req.query.ids) {
        const idList = req.query.ids.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
        if (idList.length > 0) {
            matchStage._id = { $in: idList.map(id => new mongoose.Types.ObjectId(id)) };
        }
    }

    if (category && category !== 'all') {
        if (category === 'isFeatured') {
            matchStage.isFeatured = true;
        } else if (mongoose.Types.ObjectId.isValid(category)) {
            matchStage.category = new mongoose.Types.ObjectId(category);
        } else {
            // If category is a slug, find its ID
            const foundCategory = await Category.findOne({ slug: category });
            if (foundCategory) {
                matchStage.category = foundCategory._id;
            } else {
                // If category not found, ensure query returns nothing
                matchStage.category = new mongoose.Types.ObjectId();
            }
        }
    }

    if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        matchStage.name = { $regex: safeSearch, $options: 'i' };
    }

    if (subcategory && subcategory !== 'all') {
        if (mongoose.Types.ObjectId.isValid(subcategory)) {
            matchStage.subcategory = new mongoose.Types.ObjectId(subcategory);
        }
    }

    if (minPrice || maxPrice) {
        matchStage.price = {};
        if (minPrice) matchStage.price.$gte = parseFloat(minPrice);
        if (maxPrice) matchStage.price.$lte = parseFloat(maxPrice);
    }

    const pipeline = [{ $match: matchStage }];
    
    pipeline.push({
        $addFields: { totalStock: { $sum: '$sizes.stock' } }
    });

    if (stockStatus) {
        if (stockStatus === 'lowStock') pipeline.push({ $match: { totalStock: { $lt: 10, $gt: 0 } } });
        else if (stockStatus === 'outOfStock') pipeline.push({ $match: { totalStock: 0 } });
    }

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Product.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Populate full details for Admin
    pipeline.push(
        { $unwind: { path: '$sizes', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'sizes',
                localField: 'sizes.size',
                foreignField: '_id',
                as: 'sizes.size'
            }
        },
        { $unwind: { path: '$sizes.size', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: '$_id',
                root: { $first: '$$ROOT' },
                sizes: { $push: '$sizes' }
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        '$root',
                        {
                            sizes: {
                                $filter: {
                                    input: '$sizes',
                                    as: 's',
                                    cond: { $ne: ['$$s', {}] }
                                }
                            }
                        }
                    ]
                }
            }
        },
        {
            $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
            $lookup: { from: 'subcategories', localField: 'subcategory', foreignField: '_id', as: 'subcategory' }
        },
        { $unwind: { path: '$subcategory', preserveNullAndEmptyArrays: true } }
    );

    let sortObj = { createdAt: -1, _id: 1 };
    if (sort === 'price') sortObj = { price: 1, _id: 1 };
    else if (sort === '-price') sortObj = { price: -1, _id: 1 };
    else if (sort === 'stockHigh') sortObj = { totalStock: -1, _id: 1 };
    else if (sort === 'stockLow') sortObj = { totalStock: 1, _id: 1 };

    pipeline.push({ $sort: sortObj });
    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    pipeline.push({ $skip: skip }, { $limit: Math.max(1, Number(limit)) });

    const products = await Product.aggregate(pipeline);

    res.json({ 
        success: true, 
        total, 
        currentPage: Number(page),
        pages: Math.ceil(total / Number(limit)),
        products 
    });
});

export const getAdminProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category')
        .populate('subcategory')
        .populate('sizes.size')
        .lean();

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) return res.status(404).json({ message: 'Product not found' });

    const updateFields = parseProductData(req);
    let finalImages = [...existingProduct.images];

    if (req.body.images !== undefined) {
        try {
            const updatedImagesList = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
            const imagesToDelete = existingProduct.images.filter(img => !updatedImagesList.includes(img));
            for (const url of imagesToDelete) await deleteImage(url);
            finalImages = updatedImagesList;
        } catch (e) { console.error("Image cleanup error", e); }
    }

    if (req.files && req.files.length) {
        const newUploads = await uploadMultipleImages(req.files, 'products');
        finalImages = [...finalImages, ...newUploads];
    }

    updateFields.images = finalImages;

    try {
        const validatedData = updateProductSchema.parse(updateFields);
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: validatedData },
            { returnDocument: 'after', runValidators: true }
        );

        // Clear caches
        clearCache('cache:/api/products*');
        clearCache('cache:/api/home-layout*');
        clearCache('cache:/api/flash-sales*');
        clearCache('cache:/api/admin/dashboard*');

        if (product) {
            auditLogService.recordLog({
                req,
                action: "UPDATE",
                module: "Product",
                resourceId: product._id,
                resourceName: product.name,
                description: `Updated product: "${product.name}"`,
                details: validatedData,
            });
        }

        res.json(product);
    } catch (error) {
        if (error instanceof ZodError) return handleZodError(error, res);
        throw error;
    }
});

export const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const productName = product.name;
    const productId = product._id;

    if (product.images?.length) await Promise.all(product.images.map(img => deleteImage(img)));
    await product.deleteOne();

    // Clear caches
    clearCache('cache:/api/products*');
    clearCache('cache:/api/home-layout*');
    clearCache('cache:/api/flash-sales*');
    clearCache('cache:/api/admin/dashboard*');

    auditLogService.recordLog({
        req,
        action: "DELETE",
        module: "Product",
        resourceId: productId,
        resourceName: productName,
        description: `Deleted product: "${productName}"`,
    });

    res.json({ message: 'Product purged.' });
});

export const getProductHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const product = await Product.findById(id).select('name images price').lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const filter = {
        'orderItems.product': new mongoose.Types.ObjectId(id),
        'paymentResult.status': { $in: ['Completed', 'COD'] }
    };

    // FIX Bug 7: Use MongoDB aggregation for stats instead of fetching all orders into RAM
    const statsAgg = await Order.aggregate([
        { $match: filter },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.product': new mongoose.Types.ObjectId(id) } },
        {
            $group: {
                _id: null,
                totalSold: { $sum: '$orderItems.quantity' },
                totalRevenue: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] } },
                orderCount: { $sum: 1 }
            }
        }
    ]);

    const stats = statsAgg[0] || { totalSold: 0, totalRevenue: 0, orderCount: 0 };
    const total = await Order.countDocuments(filter);
    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

    // Paginated orders for history table
    const orders = await Order.find(filter)
        .populate('user', 'name email avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean();

    const history = orders.map(order => {
        const item = order.orderItems.find(oi => String(oi.product) === id);
        return {
            orderId: order._id,
            date: order.createdAt,
            customer: order.user || { name: order.shippingAddress.name, email: order.shippingAddress.email },
            quantity: item?.quantity || 0,
            price: item?.price || 0,
            total: (item?.quantity || 0) * (item?.price || 0),
            orderStatus: order.orderStatus,
            isGuest: order.isGuest
        };
    });

    res.json({
        success: true,
        product,
        stats: {
            totalSold: stats.totalSold,
            totalRevenue: stats.totalRevenue,
            orderCount: total
        },
        pagination: {
            total,
            currentPage: Number(page),
            pages: Math.ceil(total / Number(limit))
        },
        history
    });
});

export const updateProductBanner = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let bannerImage = product.banner?.image;

    if (req.file) {
        // Upload new banner
        const newBannerUrl = await uploadImage(req.file, 'banners');
        // Delete old banner image if it exists
        if (product.banner?.image) {
            await deleteImage(product.banner.image);
        }
        bannerImage = newBannerUrl;
    }

    product.banner = {
        image: bannerImage,
        link: req.body.bannerLink || ''
    };

    await product.save();

    // Clear caches
    clearCache('cache:/api/products*');
    clearCache('cache:/api/home-layout*');

    res.json(product);
});

export const deleteProductBanner = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.banner?.image) {
        await deleteImage(product.banner.image);
    }

    product.banner = undefined;
    await product.save();

    // Clear caches
    clearCache('cache:/api/products*');
    clearCache('cache:/api/home-layout*');

    res.json(product);
});

export const patchProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const whitelist = ['isFeatured', 'isActive', 'showReviews', 'featuredOrder'];
    const updates = req.body;

    let hasUpdates = false;
    whitelist.forEach(field => {
        if (updates[field] !== undefined) {
            product[field] = updates[field];
            hasUpdates = true;
        }
    });

    if (hasUpdates) {
        await product.save();
        // Clear caches
        clearCache('cache:/api/products*');
        clearCache('cache:/api/home-layout*');
        clearCache('cache:/api/flash-sales*');
        clearCache('cache:/api/admin/dashboard*');
    }

    res.json(product);
});
