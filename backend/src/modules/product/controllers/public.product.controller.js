import mongoose from 'mongoose';
import Product from '../product.model.js';
import Category from '../../category/category.model.js';
import Subcategory from '../../subcategory/subcategory.model.js';
import { asyncHandler } from '../../../middleware/asyncHandler.js';

export const getPublicProducts = asyncHandler(async (req, res) => {
    const {
        category,
        subcategory,
        search,
        minPrice,
        maxPrice,
        sort,
        page = 1,
        limit = 24,
        isFeatured,
        ids,
    } = req.query;

    const itemsLimit = Math.max(1, Number(limit));
    const skip = (Math.max(1, Number(page)) - 1) * itemsLimit;
    const matchStage = { isActive: true };

    if (isFeatured === 'true') matchStage.isFeatured = true;

    if (ids) {
        const idList = ids.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
        if (idList.length > 0) {
            matchStage._id = { $in: idList.map(id => new mongoose.Types.ObjectId(id)) };
        }
    }

    if (category && category !== 'all') {
        if (category === 'on-sale') {
            matchStage.discount = { $gt: 0 };
        } else if (category === 'featured') {
            const featCats = await Category.find({ isFeatured: true }).select('_id');
            if (featCats.length > 0) {
                matchStage.category = { $in: featCats.map(c => new mongoose.Types.ObjectId(c._id)) };
            } else return res.json({ success: true, total: 0, pages: 0, products: [] });
        } else if (mongoose.Types.ObjectId.isValid(category)) {
            matchStage.category = new mongoose.Types.ObjectId(category);
        } else {
            const catDoc = await Category.findOne({ slug: category }).select('_id');
            if (catDoc) matchStage.category = new mongoose.Types.ObjectId(catDoc._id);
            else return res.json({ success: true, total: 0, pages: 0, products: [] });
        }
    }

    if (subcategory && subcategory !== 'all') {
        if (mongoose.Types.ObjectId.isValid(subcategory)) {
            matchStage.subcategory = new mongoose.Types.ObjectId(subcategory);
        } else {
            const subDoc = await Subcategory.findOne({ slug: subcategory }).select('_id');
            if (subDoc) matchStage.subcategory = new mongoose.Types.ObjectId(subDoc._id);
            else return res.json({ success: true, total: 0, pages: 0, products: [] });
        }
    }

    if (search) {
        const words = search.trim().split(/\s+/).filter(Boolean);
        if (words.length > 0) {
            const searchRegex = words.map(word => 
                `(?=.*${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`
            ).join('');
            matchStage.name = { $regex: searchRegex, $options: 'i' };
        }
    }

    if (minPrice || maxPrice) {
        matchStage.price = {};
        if (minPrice) matchStage.price.$gte = Number(minPrice);
        if (maxPrice) matchStage.price.$lte = Number(maxPrice);
    }

    // Advanced Aggregation Matrix
    const pipeline = [
        { $match: matchStage },
        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [
                    { $addFields: { totalStock: { $sum: '$sizes.stock' } } },
                    { 
                        $sort: sort === 'price' ? { price: 1 } : 
                               sort === '-price' ? { price: -1 } : 
                               { createdAt: -1 } 
                    },
                    { $skip: skip },
                    { $limit: itemsLimit },
                    // Join Category & Subcategory after pagination for performance
                    {
                        $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' }
                    },
                    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: { from: 'subcategories', localField: 'subcategory', foreignField: '_id', as: 'subcategory' }
                    },
                    { $unwind: { path: '$subcategory', preserveNullAndEmptyArrays: true } },
                    // Size Population Sub-Pipeline
                    { $unwind: { path: '$sizes', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'sizes',
                            let: { sizeId: '$sizes.size' },
                            pipeline: [
                                { 
                                    $match: { 
                                        $expr: { 
                                            $eq: [
                                                '$_id', 
                                                { 
                                                    $cond: { 
                                                        if: { $eq: [{ $type: '$$sizeId' }, 'string'] }, 
                                                        then: { $toObjectId: '$$sizeId' }, 
                                                        else: '$$sizeId' 
                                                    } 
                                                }
                                            ] 
                                        } 
                                    } 
                                },
                                { $project: { name: 1 } }
                            ],
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
                                                cond: { $ne: ['$$s.size', null] }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    // Final Clean Projection
                    {
                        $project: {
                            name: 1, slug: 1, price: 1, discount: 1, isFeatured: 1,
                            images: { $slice: ['$images', 1] },
                            category: { name: 1, slug: 1, _id: 1 },
                            subcategory: { name: 1, slug: 1, _id: 1 },
                            sizes: 1,
                            totalStock: 1,
                            showReviews: 1,
                            averageRating: 1,
                            totalReviews: 1
                        }
                    }
                ]
            }
        }
    ];

    const result = await Product.aggregate(pipeline);
    const total = result[0].metadata[0]?.total || 0;
    const products = result[0].data;

    res.json({
        success: true,
        total,
        pages: Math.ceil(total / itemsLimit),
        currentPage: Number(page),
        products
    });
});

export const getPublicProductBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    // Single aggregation: avoids multiple populate() roundtrips
    const results = await Product.aggregate([
        { $match: { slug, isActive: true } },
        { $limit: 1 },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
                pipeline: [{ $project: { name: 1, slug: 1 } }]
            }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'subcategories',
                localField: 'subcategory',
                foreignField: '_id',
                as: 'subcategory',
                pipeline: [{ $project: { name: 1, slug: 1 } }]
            }
        },
        { $unwind: { path: '$subcategory', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$sizes', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'sizes',
                localField: 'sizes.size',
                foreignField: '_id',
                as: 'sizes.sizeObj',
                pipeline: [{ $project: { name: 1 } }]
            }
        },
        {
            $addFields: {
                'sizes.size': { $arrayElemAt: ['$sizes.sizeObj', 0] }
            }
        },
        {
            $project: { 'sizes.sizeObj': 0 }
        },
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
                                    cond: {
                                        $and: [
                                            { $ne: ['$$s', null] },
                                            { $ne: ['$$s', {}] },
                                            { $ne: [{ $type: '$$s.size' }, 'missing'] },
                                            { $ne: ['$$s.size', null] }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        // Strip admin-only fields from response
        {
            $project: {
                isActive: 0,
                featuredOrder: 0
            }
        }
    ]);

    if (!results || results.length === 0) {
        return res.status(404).json({ message: 'Artifact not found' });
    }

    const product = results[0];

    // HTTP Cache headers — browser & CDN can serve this without hitting the server at all
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.set('Vary', 'Accept-Encoding');

    res.json(product);
});

export const getPublicProductById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.params.slug = id;
        return getPublicProductBySlug(req, res, next);
    }

    const product = await Product.findOne({ _id: id, isActive: true })
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('sizes.size', 'name')
        .lean();

    if (!product) return res.status(404).json({ message: 'Artifact not found' });

    const { isActive, featuredOrder, ...publicData } = product;

    // HTTP Cache headers
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.set('Vary', 'Accept-Encoding');

    res.json(publicData);
});
