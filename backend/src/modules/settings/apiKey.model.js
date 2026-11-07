import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
    fbPixelId: { type: String, default: "" },
    fbAccessToken: { type: String, default: "" },
    fbTestEventCode: { type: String, default: "" },
    gtmId: { type: String, default: "" },
    tiktokPixelId: { type: String, default: "" },
    tiktokAccessToken: { type: String, default: "" },
    snapPixelId: { type: String, default: "" },
    pinterestTagId: { type: String, default: "" },
    googleAdsId: { type: String, default: "" },
    clarityId: { type: String, default: "" },
    
    // SSLCommerz
    sslStoreId: { type: String, default: "" },
    sslStorePassword: { type: String, default: "" },
    sslIsTest: { type: Boolean, default: true },

    // bKash
    bkashAppKey: { type: String, default: "" },
    bkashAppSecret: { type: String, default: "" },
    bkashUsername: { type: String, default: "" },
    bkashPassword: { type: String, default: "" },
    bkashIsTest: { type: Boolean, default: true },

    // SMTP
    mailHost: { type: String, default: "" },
    mailPort: { type: String, default: "" },
    mailUser: { type: String, default: "" },
    mailPass: { type: String, default: "" },
    mailFrom: { type: String, default: "" },

    // SMS
    smsApiKey: { type: String, default: "" },
    smsSenderId: { type: String, default: "" },

    // Social Auth
    googleClientId: { type: String, default: "" },
    googleClientSecret: { type: String, default: "" },
    facebookAppId: { type: String, default: "" },

    // Cloudinary
    cloudinaryCloudName: { type: String, default: "" },
    cloudinaryApiKey: { type: String, default: "" },
    cloudinaryApiSecret: { type: String, default: "" },
    geminiApiKey: { type: String, default: "" },
}, { timestamps: true });

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export default ApiKey;
