"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const debateSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    tags: [{
            type: String,
            trim: true,
            lowercase: true
        }],
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Technology', 'Politics', 'Science', 'Social', 'Economics', 'Environment', 'Sports', 'Entertainment', 'Other'],
        default: 'Other'
    },
    imageUrl: {
        type: String,
        default: 'https://placehold.co/600x400.png'
    },
    creatorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [3600, 'Duration must be at least 1 hour (3600 seconds)'],
        max: [604800, 'Duration cannot be more than 1 week (604800 seconds)'],
        default: 86400
    },
    endTime: {
        type: Date,
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    supportUsers: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    opposeUsers: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }]
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});
debateSchema.index({ creatorId: 1 });
debateSchema.index({ category: 1 });
debateSchema.index({ tags: 1 });
debateSchema.index({ createdAt: -1 });
debateSchema.index({ endTime: 1 });
debateSchema.index({ isActive: 1 });
debateSchema.index({ title: 'text', description: 'text' });
debateSchema.pre('save', function (next) {
    if (this.isNew || !this.endTime) {
        this.endTime = new Date(Date.now() + this.duration * 1000);
    }
    next();
});
debateSchema.methods.isExpired = function () {
    return new Date() > this.endTime;
};
debateSchema.virtual('isActiveAndNotExpired').get(function () {
    return this.isActive && !this.isExpired();
});
exports.default = mongoose_1.default.model('Debate', debateSchema);
//# sourceMappingURL=Debate.js.map