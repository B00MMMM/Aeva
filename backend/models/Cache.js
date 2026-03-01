const mongoose = require('mongoose');

const CacheSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '1h' } // Automatically delete documents 1 hour after expiresAt
    }
}, { timestamps: true });

module.exports = mongoose.model('Cache', CacheSchema);
