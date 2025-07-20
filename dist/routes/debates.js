"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Debate_1 = __importDefault(require("@/models/Debate"));
const User_1 = __importDefault(require("@/models/User"));
const firebaseAuth_1 = require("@/middleware/firebaseAuth");
const validation_1 = require("@/middleware/validation");
const router = express_1.default.Router();
router.get('/', validation_1.validatePagination, async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', category, tags, search, isActive } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const sortOrder = order === 'desc' ? -1 : 1;
        const filter = {};
        if (category) {
            filter.category = category;
        }
        if (tags) {
            filter.tags = { $in: tags.split(',').map(tag => tag.trim()) };
        }
        if (search) {
            filter.$text = { $search: search };
        }
        if (isActive !== undefined) {
            filter.isActive = String(isActive) === 'true';
        }
        const debates = await Debate_1.default.find(filter)
            .populate('creatorId', 'name avatarUrl')
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(Number(limit));
        const total = await Debate_1.default.countDocuments(filter);
        const response = {
            success: true,
            data: {
                debates,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalDebates: total,
                    hasNext: skip + Number(limit) < total,
                    hasPrev: Number(page) > 1
                }
            }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', validation_1.validateObjectId, async (req, res, next) => {
    try {
        const debate = await Debate_1.default.findById(req.params.id)
            .populate('creatorId', 'name avatarUrl');
        if (!debate) {
            const response = {
                success: false,
                error: 'Debate not found'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: { debate }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.post('/', firebaseAuth_1.verifyFirebaseToken, validation_1.validateDebateCreation, async (req, res, next) => {
    try {
        if (!req.user) {
            const response = {
                success: false,
                error: 'User authentication required'
            };
            return res.status(401).json(response);
        }
        const { title, description, category, tags, duration, imageUrl } = req.body;
        const debate = new Debate_1.default({
            title,
            description,
            category,
            tags: tags || [],
            duration,
            imageUrl: imageUrl || 'https://placehold.co/600x400.png',
            creatorId: req.user._id
        });
        await debate.save();
        await User_1.default.findByIdAndUpdate(req.user._id, {
            $inc: { debatesParticipated: 1 }
        });
        await debate.populate('creatorId', 'name avatarUrl');
        const response = {
            success: true,
            data: { debate },
            message: 'Debate created successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', firebaseAuth_1.verifyFirebaseToken, validation_1.validateObjectId, async (req, res, next) => {
    try {
        if (!req.user) {
            const response = {
                success: false,
                error: 'User authentication required'
            };
            return res.status(401).json(response);
        }
        const debate = await Debate_1.default.findById(req.params.id);
        if (!debate) {
            const response = {
                success: false,
                error: 'Debate not found'
            };
            return res.status(404).json(response);
        }
        if (debate.creatorId.toString() !== req.user._id.toString()) {
            const response = {
                success: false,
                error: 'Not authorized to update this debate'
            };
            return res.status(403).json(response);
        }
        if (debate.isExpired()) {
            const response = {
                success: false,
                error: 'Cannot update expired debate'
            };
            return res.status(400).json(response);
        }
        const allowedUpdates = ['title', 'description', 'tags', 'imageUrl', 'isActive'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        if (!isValidOperation) {
            const response = {
                success: false,
                error: 'Invalid updates'
            };
            return res.status(400).json(response);
        }
        const updatedDebate = await Debate_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('creatorId', 'name avatarUrl');
        const response = {
            success: true,
            data: { debate: updatedDebate },
            message: 'Debate updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', firebaseAuth_1.verifyFirebaseToken, validation_1.validateObjectId, async (req, res, next) => {
    try {
        if (!req.user) {
            const response = {
                success: false,
                error: 'User authentication required'
            };
            return res.status(401).json(response);
        }
        const debate = await Debate_1.default.findById(req.params.id);
        if (!debate) {
            const response = {
                success: false,
                error: 'Debate not found'
            };
            return res.status(404).json(response);
        }
        if (debate.creatorId.toString() !== req.user._id.toString()) {
            const response = {
                success: false,
                error: 'Not authorized to delete this debate'
            };
            return res.status(403).json(response);
        }
        await Debate_1.default.findByIdAndDelete(req.params.id);
        const response = {
            success: true,
            message: 'Debate deleted successfully'
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.get('/categories', async (req, res, next) => {
    try {
        const categories = ['Technology', 'Politics', 'Science', 'Social', 'Economics', 'Environment', 'Sports', 'Entertainment', 'Other'];
        const response = {
            success: true,
            data: { categories }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=debates.js.map