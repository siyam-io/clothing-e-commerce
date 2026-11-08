import express from 'express';
import {
    getPublicCategories,
    getPublicCategoryBySlug
} from '../controllers/public.category.controller.js';

import { cacheMiddleware } from '../../../middleware/cacheMiddleware.js';

const router = express.Router();

router.get('/', cacheMiddleware(600), getPublicCategories); // Cache for 10 mins
router.get('/public', cacheMiddleware(600), getPublicCategories);
router.get('/:slug', cacheMiddleware(300), getPublicCategoryBySlug); // Cache for 5 mins

export default router;
