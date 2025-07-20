"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("@/models/User"));
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const router = express_1.default.Router();
router.get('/', validation_1.validatePagination, async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sort = 'totalVotes', order = 'desc' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const sortOrder = order === 'desc' ? -1 : 1;
        const users = await User_1.default.find()
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(Number(limit));
        const total = await User_1.default.countDocuments();
        const response = {
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalUsers: total,
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
router.get('/leaderboard', async (req, res, next) => {
    try {
        const { period = 'all-time', limit = 50 } = req.query;
        let dateFilter = {};
        const now = new Date();
        if (period === 'weekly') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = { createdAt: { $gte: weekAgo } };
        }
        else if (period === 'monthly') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter = { createdAt: { $gte: monthAgo } };
        }
        if (period === 'weekly' || period === 'monthly') {
            const leaderboard = await User_1.default.aggregate([
                {
                    $lookup: {
                        from: 'arguments',
                        localField: '_id',
                        foreignField: 'authorId',
                        as: 'arguments'
                    }
                },
                {
                    $addFields: {
                        periodVotes: {
                            $sum: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$arguments',
                                            cond: {
                                                $gte: ['$$this.createdAt', period === 'weekly'
                                                        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                                                        : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                                                ]
                                            }
                                        }
                                    },
                                    as: 'arg',
                                    in: {
                                        $subtract: [
                                            { $ifNull: ['$$arg.upvotes', 0] },
                                            { $ifNull: ['$$arg.downvotes', 0] }
                                        ]
                                    }
                                }
                            }
                        },
                        periodDebates: {
                            $size: {
                                $setUnion: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$arguments',
                                                cond: {
                                                    $gte: ['$$this.createdAt', period === 'weekly'
                                                            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                                                            : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                                                    ]
                                                }
                                            }
                                        },
                                        as: 'arg',
                                        in: '$$arg.debateId'
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $match: {
                        periodVotes: { $gt: 0 }
                    }
                },
                {
                    $sort: { periodVotes: -1 }
                },
                {
                    $limit: parseInt(limit)
                },
                {
                    $project: {
                        name: 1,
                        avatarUrl: 1,
                        totalVotes: '$periodVotes',
                        debatesParticipated: '$periodDebates',
                        id: '$_id',
                        _id: 0
                    }
                }
            ]);
            const response = {
                success: true,
                data: leaderboard
            };
            res.json(response);
        }
        else {
            const users = await User_1.default.find()
                .sort({ totalVotes: -1 })
                .limit(parseInt(limit))
                .select('name avatarUrl totalVotes debatesParticipated');
            const response = {
                success: true,
                data: users
            };
            res.json(response);
        }
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', validation_1.validateObjectId, async (req, res, next) => {
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            const response = {
                success: false,
                error: 'User not found'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: { user }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.get('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const response = {
            success: true,
            data: { user: req.user }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.put('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const allowedUpdates = ['name', 'avatarUrl'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        if (!isValidOperation) {
            const response = {
                success: false,
                error: 'Invalid updates. Only name and avatarUrl can be updated.'
            };
            res.status(400).json(response);
            return;
        }
        const user = await User_1.default.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
        const response = {
            success: true,
            data: { user },
            message: 'Profile updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map