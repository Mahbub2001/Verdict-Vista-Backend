"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const Argument_1 = __importDefault(require("@/models/Argument"));
const Debate_1 = __importDefault(require("@/models/Debate"));
const User_1 = __importDefault(require("@/models/User"));
const firebaseAuth_1 = require("@/middleware/firebaseAuth");
const validation_1 = require("@/middleware/validation");
const moderation_1 = require("@/utils/moderation");
const router = express_1.default.Router();
router.get("/debates/:debateId/arguments", validation_1.validateDebateId, validation_1.validatePagination, async (req, res, next) => {
    try {
        const { debateId } = req.params;
        const { page = 1, limit = 10, sort = "createdAt", order = "desc", } = req.query;
        const debate = await Debate_1.default.findById(debateId);
        if (!debate) {
            const response = {
                success: false,
                error: "Debate not found",
            };
            return res.status(404).json(response);
        }
        const skip = (Number(page) - 1) * Number(limit);
        const sortOrder = order === "desc" ? -1 : 1;
        const argumentsList = await Argument_1.default.find({ debateId })
            .populate("authorId", "name avatarUrl")
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(Number(limit));
        let userId = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            try {
                const token = authHeader.split(" ")[1];
            }
            catch (error) { }
        }
        const total = await Argument_1.default.countDocuments({ debateId });
        const response = {
            success: true,
            data: {
                arguments: argumentsList,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalArguments: total,
                    hasNext: skip + Number(limit) < total,
                    hasPrev: Number(page) > 1,
                },
            },
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.get("/debates/:debateId/arguments/with-votes", firebaseAuth_1.verifyFirebaseToken, validation_1.validateDebateId, validation_1.validatePagination, async (req, res, next) => {
    try {
        const { debateId } = req.params;
        const { page = 1, limit = 10, sort = "createdAt", order = "desc", } = req.query;
        if (!req.user) {
            const response = {
                success: false,
                error: "Authentication required",
            };
            return res.status(401).json(response);
        }
        const debate = await Debate_1.default.findById(debateId);
        if (!debate) {
            const response = {
                success: false,
                error: "Debate not found",
            };
            return res.status(404).json(response);
        }
        const skip = (Number(page) - 1) * Number(limit);
        const sortOrder = order === "desc" ? -1 : 1;
        const argumentsList = await Argument_1.default.find({ debateId })
            .populate("authorId", "name avatarUrl")
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(Number(limit));
        const userId = req.user._id.toString();
        const argumentsWithVotes = argumentsList.map((arg) => {
            const hasUpvoted = arg.upvotedBy?.some((id) => id.toString() === userId);
            const hasDownvoted = arg.downvotedBy?.some((id) => id.toString() === userId);
            let userVote = null;
            if (hasUpvoted)
                userVote = "upvote";
            else if (hasDownvoted)
                userVote = "downvote";
            return {
                ...arg.toJSON(),
                userVote,
            };
        });
        const total = await Argument_1.default.countDocuments({ debateId });
        const response = {
            success: true,
            data: {
                arguments: argumentsWithVotes,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalArguments: total,
                    hasNext: skip + Number(limit) < total,
                    hasPrev: Number(page) > 1,
                },
            },
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.get("/debates/:debateId/user-side", firebaseAuth_1.verifyFirebaseToken, validation_1.validateDebateId, async (req, res, next) => {
    try {
        const { debateId } = req.params;
        if (!req.user) {
            const response = {
                success: false,
                error: "Authentication required",
            };
            return res.status(401).json(response);
        }
        const debate = await Debate_1.default.findById(debateId);
        if (!debate) {
            const response = {
                success: false,
                error: "Debate not found",
            };
            return res.status(404).json(response);
        }
        const userId = req.user._id;
        const isInSupport = debate.supportUsers.some((id) => id.toString() === userId.toString());
        const isInOppose = debate.opposeUsers.some((id) => id.toString() === userId.toString());
        if (isInSupport) {
            const response = {
                success: true,
                data: { side: "support" },
            };
            return res.status(200).json(response);
        }
        if (isInOppose) {
            const response = {
                success: true,
                data: { side: "oppose" },
            };
            return res.status(200).json(response);
        }
        const response = {
            success: true,
            data: { side: null },
        };
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
});
router.post("/debates/:debateId/join-side", firebaseAuth_1.verifyFirebaseToken, validation_1.validateDebateId, async (req, res, next) => {
    try {
        const { debateId } = req.params;
        const { side } = req.body;
        if (!side || !["support", "oppose"].includes(side)) {
            const response = {
                success: false,
                error: 'Invalid side. Must be either "support" or "oppose"',
            };
            return res.status(400).json(response);
        }
        if (!req.user) {
            const response = {
                success: false,
                error: "Authentication required",
            };
            return res.status(401).json(response);
        }
        const debate = await Debate_1.default.findById(debateId);
        if (!debate) {
            const response = {
                success: false,
                error: "Debate not found",
            };
            return res.status(404).json(response);
        }
        if (!debate.isActive || debate.isExpired()) {
            const response = {
                success: false,
                error: "Debate is not active or has expired",
            };
            return res.status(400).json(response);
        }
        const userId = req.user._id;
        const isInSupport = debate.supportUsers.some((id) => id.toString() === userId.toString());
        const isInOppose = debate.opposeUsers.some((id) => id.toString() === userId.toString());
        if (isInSupport || isInOppose) {
            const currentSide = isInSupport ? "support" : "oppose";
            if (currentSide !== side) {
                const response = {
                    success: false,
                    error: `You have already joined the ${currentSide} side of this debate. You cannot switch sides.`,
                };
                return res.status(400).json(response);
            }
            const response = {
                success: true,
                data: { side: currentSide },
                message: `You have already joined the ${currentSide} side`,
            };
            return res.status(200).json(response);
        }
        if (side === "support") {
            debate.supportUsers.push(new mongoose_1.default.Types.ObjectId(userId));
        }
        else {
            debate.opposeUsers.push(new mongoose_1.default.Types.ObjectId(userId));
        }
        await debate.save();
        const response = {
            success: true,
            data: { side },
            message: `Successfully joined the ${side} side`,
        };
        res.status(201).json(response);
    }
    catch (error) {
        next(error);
    }
});
router.post("/debates/:debateId/arguments", firebaseAuth_1.verifyFirebaseToken, validation_1.validateDebateId, validation_1.validateArgumentCreation, async (req, res, next) => {
    try {
        const { debateId } = req.params;
        const { text, side } = req.body;
        const moderationResult = (0, moderation_1.moderateText)(text.trim());
        if (!moderationResult.isClean) {
            const errorMessage = (0, moderation_1.getModerationErrorMessage)(moderationResult);
            const response = {
                success: false,
                error: errorMessage,
            };
            return res.status(400).json(response);
        }
        const debate = await Debate_1.default.findById(debateId);
        if (!debate) {
            const response = {
                success: false,
                error: "Debate not found",
            };
            return res.status(404).json(response);
        }
        if (!debate.isActive || debate.isExpired()) {
            const response = {
                success: false,
                error: "Debate is not active or has expired",
            };
            return res.status(400).json(response);
        }
        if (!req.user) {
            const response = {
                success: false,
                error: "Authentication required",
            };
            return res.status(401).json(response);
        }
        const existingArgument = await Argument_1.default.findOne({
            debateId,
            authorId: req.user._id,
        });
        const userId = req.user._id;
        const isInSupport = debate.supportUsers.some((id) => id.toString() === userId.toString());
        const isInOppose = debate.opposeUsers.some((id) => id.toString() === userId.toString());
        if (existingArgument && existingArgument.side !== side) {
            const response = {
                success: false,
                error: `You have already joined the ${existingArgument.side} side of this debate. You cannot switch sides or join both sides.`,
            };
            return res.status(400).json(response);
        }
        if ((isInSupport && side !== "support") ||
            (isInOppose && side !== "oppose")) {
            const currentSide = isInSupport ? "support" : "oppose";
            const response = {
                success: false,
                error: `You have already joined the ${currentSide} side of this debate. You cannot switch sides or join both sides.`,
            };
            return res.status(400).json(response);
        }
        if (!isInSupport && !isInOppose) {
            if (side === "support") {
                debate.supportUsers.push(new mongoose_1.default.Types.ObjectId(userId));
            }
            else {
                debate.opposeUsers.push(new mongoose_1.default.Types.ObjectId(userId));
            }
            await debate.save();
        }
        const argument = new Argument_1.default({
            debateId,
            authorId: req.user._id,
            text,
            side,
        });
        await argument.save();
        await argument.populate("authorId", "name avatarUrl");
        const response = {
            success: true,
            data: { argument },
            message: "Argument created successfully",
        };
        res.status(201).json(response);
    }
    catch (error) {
        next(error);
    }
});
router.get("/arguments/:id", validation_1.validateObjectId, async (req, res, next) => {
    try {
        const argument = await Argument_1.default.findById(req.params.id)
            .populate("authorId", "name avatarUrl")
            .populate("debateId", "title");
        if (!argument) {
            const response = {
                success: false,
                error: "Argument not found",
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: { argument },
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.put("/arguments/:id", firebaseAuth_1.verifyFirebaseToken, validation_1.validateObjectId, async (req, res, next) => {
    try {
        const argument = await Argument_1.default.findById(req.params.id);
        if (!argument) {
            const response = {
                success: false,
                error: "Argument not found",
            };
            return res.status(404).json(response);
        }
        if (!req.user) {
            const response = {
                success: false,
                error: "Authentication required",
            };
            return res.status(401).json(response);
        }
        if (argument.authorId.toString() !== req.user._id.toString()) {
            const response = {
                success: false,
                error: "Not authorized to update this argument",
            };
            return res.status(403).json(response);
        }
        const debate = await Debate_1.default.findById(argument.debateId);
        if (!debate || !debate.isActive || debate.isExpired()) {
            const response = {
                success: false,
                error: "Cannot update argument for inactive or expired debate",
            };
            return res.status(400).json(response);
        }
        const EDIT_WINDOW_MS = 5 * 60 * 1000;
        const argumentCreatedAt = new Date(argument.createdAt);
        const currentTime = new Date();
        const timeDifference = currentTime.getTime() - argumentCreatedAt.getTime();
        if (timeDifference > EDIT_WINDOW_MS) {
            const response = {
                success: false,
                error: "Cannot update argument. Edit window (5 minutes) has expired.",
            };
            return res.status(400).json(response);
        }
        const allowedUpdates = ["text"];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        if (!isValidOperation) {
            const response = {
                success: false,
                error: "Invalid updates. Only text can be updated.",
            };
            return res.status(400).json(response);
        }
        const updatedArgument = await Argument_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate("authorId", "name avatarUrl");
        const response = {
            success: true,
            data: { argument: updatedArgument },
            message: "Argument updated successfully",
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.delete("/arguments/:id", firebaseAuth_1.verifyFirebaseToken, validation_1.validateObjectId, async (req, res, next) => {
    try {
        const argument = await Argument_1.default.findById(req.params.id);
        if (!argument) {
            const response = {
                success: false,
                error: "Argument not found",
            };
            return res.status(404).json(response);
        }
        if (!req.user) {
            const response = {
                success: false,
                error: "Authentication required",
            };
            return res.status(401).json(response);
        }
        if (argument.authorId.toString() !== req.user._id.toString()) {
            const response = {
                success: false,
                error: "Not authorized to delete this argument",
            };
            return res.status(403).json(response);
        }
        const debate = await Debate_1.default.findById(argument.debateId);
        if (!debate || !debate.isActive || debate.isExpired()) {
            const response = {
                success: false,
                error: "Cannot delete argument for inactive or expired debate",
            };
            return res.status(400).json(response);
        }
        const EDIT_WINDOW_MS = 5 * 60 * 1000;
        const argumentCreatedAt = new Date(argument.createdAt);
        const currentTime = new Date();
        const timeDifference = currentTime.getTime() - argumentCreatedAt.getTime();
        if (timeDifference > EDIT_WINDOW_MS) {
            const response = {
                success: false,
                error: "Cannot delete argument. Edit window (5 minutes) has expired.",
            };
            return res.status(400).json(response);
        }
        await Argument_1.default.findByIdAndDelete(req.params.id);
        const response = {
            success: true,
            message: "Argument deleted successfully",
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.post("/arguments/:id/vote", firebaseAuth_1.verifyFirebaseToken, validation_1.validateObjectId, async (req, res, next) => {
    try {
        const { voteType } = req.body;
        if (!voteType || !["upvote", "downvote"].includes(voteType)) {
            const response = {
                success: false,
                error: 'Vote type must be either "upvote" or "downvote"',
            };
            return res.status(400).json(response);
        }
        const argument = await Argument_1.default.findById(req.params.id);
        if (!argument) {
            const response = {
                success: false,
                error: "Argument not found",
            };
            return res.status(404).json(response);
        }
        const debate = await Debate_1.default.findById(argument.debateId);
        if (!debate || !debate.isActive || debate.isExpired()) {
            const response = {
                success: false,
                error: "Cannot vote on argument for inactive or expired debate",
            };
            return res.status(400).json(response);
        }
        if (!req.user) {
            const response = {
                success: false,
                error: "Authentication required",
            };
            return res.status(401).json(response);
        }
        const userObjectId = new mongoose_1.default.Types.ObjectId(req.user._id);
        const userId = req.user._id.toString();
        const hasUpvoted = argument.upvotedBy?.some((id) => id.toString() === userId);
        const hasDownvoted = argument.downvotedBy?.some((id) => id.toString() === userId);
        let voteChange = 0;
        if (hasUpvoted) {
            argument.upvotedBy = argument.upvotedBy?.filter((id) => id.toString() !== userId);
            argument.upvotes -= 1;
            voteChange -= 1;
        }
        if (hasDownvoted) {
            argument.downvotedBy = argument.downvotedBy?.filter((id) => id.toString() !== userId);
            argument.downvotes -= 1;
            voteChange += 1;
        }
        let action = "";
        if (voteType === "upvote" && !hasUpvoted) {
            argument.upvotedBy = argument.upvotedBy || [];
            argument.upvotedBy.push(userObjectId);
            argument.upvotes += 1;
            voteChange += 1;
            action = hasDownvoted ? "switched to upvote" : "upvoted";
        }
        else if (voteType === "downvote" && !hasDownvoted) {
            argument.downvotedBy = argument.downvotedBy || [];
            argument.downvotedBy.push(userObjectId);
            argument.downvotes += 1;
            voteChange -= 1;
            action = hasUpvoted ? "switched to downvote" : "downvoted";
        }
        else {
            action = voteType === "upvote" ? "removed upvote" : "removed downvote";
        }
        if (voteChange !== 0) {
            await User_1.default.findByIdAndUpdate(argument.authorId, {
                $inc: { totalVotes: voteChange },
            });
        }
        await argument.save();
        await argument.populate("authorId", "name avatarUrl");
        const currentUpvoted = argument.upvotedBy?.some((id) => id.toString() === userId);
        const currentDownvoted = argument.downvotedBy?.some((id) => id.toString() === userId);
        let userVote = null;
        if (currentUpvoted)
            userVote = "upvote";
        else if (currentDownvoted)
            userVote = "downvote";
        const response = {
            success: true,
            data: {
                argument: {
                    ...argument.toJSON(),
                    userVote,
                },
                action,
            },
            message: `Vote ${action} successfully`,
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=arguments.js.map