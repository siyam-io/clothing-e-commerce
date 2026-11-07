import express from 'express';
import {
    createProduct,
    getAdminProducts,
    getAdminProductById,
    getProductHistory,
    updateProduct,
    deleteProduct,
    updateProductBanner,
    deleteProductBanner,
    patchProduct
} from '../controllers/admin.product.controller.js';
import { generateProductAiContent } from '../controllers/ai.product.controller.js';
import { protect } from '../../../middleware/auth.js';
import { authorize } from '../../../middleware/rbac.js';
import upload from '../../../middleware/upload.js';

const router = express.Router();

// Base protection for all admin routes
router.use(protect);

router.post('/generate-ai-content', authorize('products:update'), generateProductAiContent);

router.route('/')
    .get(authorize('products:view'), getAdminProducts)
    .post(authorize('products:create'), upload.array('images', 20), createProduct);

router.route('/:id/history')
    .get(authorize('products:view'), getProductHistory);

router.route('/:id/banner')
    .put(authorize('products:update'), upload.single('bannerImage'), updateProductBanner)
    .delete(authorize('products:update'), deleteProductBanner);

router.route('/:id')
    .get(authorize('products:view'), getAdminProductById)
    .put(authorize('products:update'), upload.array('images', 20), updateProduct)
    .patch(authorize('products:update'), patchProduct)
    .delete(authorize('products:delete'), deleteProduct);

export default router;
