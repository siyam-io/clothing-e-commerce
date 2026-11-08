import express from 'express';
import { getSettings, updateSettings } from './settings.controller.js';
import { requireAuth, admin, optionalAuth } from '../../middleware/auth.js';
import upload from '../../middleware/upload.js';

import { cacheMiddleware } from '../../middleware/cacheMiddleware.js';

const router = express.Router();


router.get('/', optionalAuth, cacheMiddleware(3600), getSettings); // Cache for 1 hour
router.get('/public', optionalAuth, cacheMiddleware(3600), getSettings);


router.put('/', requireAuth, admin, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'logoDark', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
]), updateSettings);

router.patch('/', requireAuth, admin, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'logoDark', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
]), updateSettings);

export default router;