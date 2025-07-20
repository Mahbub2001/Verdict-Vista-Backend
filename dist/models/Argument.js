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
const argumentSchema = new mongoose_1.Schema({
    debateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Debate',
        required: true
    },
    authorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    side: {
        type: String,
        enum: ['support', 'oppose'],
        required: [true, 'Side is required']
    },
    text: {
        type: String,
        required: [true, 'Argument text is required'],
        trim: true,
        minlength: [10, 'Argument must be at least 10 characters'],
        maxlength: [1000, 'Argument cannot be more than 1000 characters']
    },
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    upvotedBy: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    downvotedBy: [{
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
argumentSchema.index({ debateId: 1 });
argumentSchema.index({ authorId: 1 });
argumentSchema.index({ side: 1 });
argumentSchema.index({ upvotes: -1 });
argumentSchema.index({ downvotes: -1 });
argumentSchema.index({ createdAt: -1 });
argumentSchema.index({ debateId: 1, side: 1 });
argumentSchema.index({ _id: 1, upvotedBy: 1 });
argumentSchema.index({ _id: 1, downvotedBy: 1 });
exports.default = mongoose_1.default.model('Argument', argumentSchema);
//# sourceMappingURL=Argument.js.map