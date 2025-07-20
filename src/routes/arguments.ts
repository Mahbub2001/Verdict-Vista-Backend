import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Argument from '@/models/Argument';
import Debate from '@/models/Debate';
import User from '@/models/User';
import { verifyFirebaseToken } from '@/middleware/firebaseAuth';
import { validateArgumentCreation, validateObjectId, validateDebateId, validatePagination } from '@/middleware/validation';
import { ApiResponse, PaginationQuery } from '@/types';
import { AuthenticatedRequest } from '@/middleware/firebaseAuth';

const router = express.Router();

router.get('/debates/:debateId/arguments', validateDebateId, validatePagination, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { debateId } = req.params;
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc'
    } = req.query as PaginationQuery;

    // -----------------------Check debate exists or not----------------------
    const debate = await Debate.findById(debateId);
    if (!debate) {
      const response: ApiResponse = {
        success: false,
        error: 'Debate not found'
      };
      return res.status(404).json(response);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const argumentsList = await Argument.find({ debateId })
      .populate('authorId', 'name avatarUrl')
      .sort({ [sort!]: sortOrder })
      .skip(skip)
      .limit(Number(limit));


    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];

      } catch (error) {
      }
    }

    const total = await Argument.countDocuments({ debateId });

    const response: ApiResponse = {
      success: true,
      data: {
        arguments: argumentsList,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalArguments: total,
          hasNext: skip + Number(limit) < total,
          hasPrev: Number(page) > 1
        }
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});


router.get('/debates/:debateId/arguments/with-votes', verifyFirebaseToken, validateDebateId, validatePagination, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { debateId } = req.params;
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc'
    } = req.query as PaginationQuery;

    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required'
      };
      return res.status(401).json(response);
    }

    // ------------------Check debate exists or not----------------------
    const debate = await Debate.findById(debateId);
    if (!debate) {
      const response: ApiResponse = {
        success: false,
        error: 'Debate not found'
      };
      return res.status(404).json(response);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const argumentsList = await Argument.find({ debateId })
      .populate('authorId', 'name avatarUrl')
      .sort({ [sort!]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const userId = req.user._id.toString();

    // -----------------Add user vote status for each argument------------------
    const argumentsWithVotes = argumentsList.map(arg => {
      const hasUpvoted = arg.upvotedBy?.some(id => id.toString() === userId);
      const hasDownvoted = arg.downvotedBy?.some(id => id.toString() === userId);
      let userVote = null;
      if (hasUpvoted) userVote = 'upvote';
      else if (hasDownvoted) userVote = 'downvote';

      return {
        ...arg.toJSON(),
        userVote
      };
    });

    const total = await Argument.countDocuments({ debateId });

    const response: ApiResponse = {
      success: true,
      data: {
        arguments: argumentsWithVotes,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalArguments: total,
          hasNext: skip + Number(limit) < total,
          hasPrev: Number(page) > 1
        }
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/debates/:debateId/user-side', verifyFirebaseToken, validateDebateId, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { debateId } = req.params;

    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required'
      };
      return res.status(401).json(response);
    }

    const debate = await Debate.findById(debateId);
    if (!debate) {
      const response: ApiResponse = {
        success: false,
        error: 'Debate not found'
      };
      return res.status(404).json(response);
    }

    const userId = req.user._id;
    const isInSupport = debate.supportUsers.some(id => id.toString() === userId.toString());
    const isInOppose = debate.opposeUsers.some(id => id.toString() === userId.toString());

    if (isInSupport) {
      const response: ApiResponse = {
        success: true,
        data: { side: 'support' }
      };
      return res.status(200).json(response);
    }

    if (isInOppose) {
      const response: ApiResponse = {
        success: true,
        data: { side: 'oppose' }
      };
      return res.status(200).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: { side: null }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});


router.post('/debates/:debateId/join-side', verifyFirebaseToken, validateDebateId, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { debateId } = req.params;
    const { side } = req.body;

    // Validate side
    if (!side || !['support', 'oppose'].includes(side)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid side. Must be either "support" or "oppose"'
      };
      return res.status(400).json(response);
    }

    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required'
      };
      return res.status(401).json(response);
    }

    // ------------------------------Check debate exists and is active--------------------
    const debate = await Debate.findById(debateId);
    if (!debate) {
      const response: ApiResponse = {
        success: false,
        error: 'Debate not found'
      };
      return res.status(404).json(response);
    }

    if (!debate.isActive || debate.isExpired()) {
      const response: ApiResponse = {
        success: false,
        error: 'Debate is not active or has expired'
      };
      return res.status(400).json(response);
    }

    const userId = req.user._id;
    const isInSupport = debate.supportUsers.some(id => id.toString() === userId.toString());
    const isInOppose = debate.opposeUsers.some(id => id.toString() === userId.toString());

    // --------------------------Check user has already joined any side-------------------------------
    if (isInSupport || isInOppose) {
      const currentSide = isInSupport ? 'support' : 'oppose';
      if (currentSide !== side) {
        const response: ApiResponse = {
          success: false,
          error: `You have already joined the ${currentSide} side of this debate. You cannot switch sides.`
        };
        return res.status(400).json(response);
      }
      
      const response: ApiResponse = {
        success: true,
        data: { side: currentSide },
        message: `You have already joined the ${currentSide} side`
      };
      return res.status(200).json(response);
    }

    if (side === 'support') {
      debate.supportUsers.push(new mongoose.Types.ObjectId(userId));
    } else {
      debate.opposeUsers.push(new mongoose.Types.ObjectId(userId));
    }

    await debate.save();

    const response: ApiResponse = {
      success: true,
      data: { side },
      message: `Successfully joined the ${side} side`
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});


router.post('/debates/:debateId/arguments', verifyFirebaseToken, validateDebateId, validateArgumentCreation, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { debateId } = req.params;
    const { text, side } = req.body;

    const debate = await Debate.findById(debateId);
    if (!debate) {
      const response: ApiResponse = {
        success: false,
        error: 'Debate not found'
      };
      return res.status(404).json(response);
    }

    if (!debate.isActive || debate.isExpired()) {
      const response: ApiResponse = {
        success: false,
        error: 'Debate is not active or has expired'
      };
      return res.status(400).json(response);
    }

    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required'
      };
      return res.status(401).json(response);
    }

    const existingArgument = await Argument.findOne({
      debateId,
      authorId: req.user._id
    });

    const userId = req.user._id;
    const isInSupport = debate.supportUsers.some(id => id.toString() === userId.toString());
    const isInOppose = debate.opposeUsers.some(id => id.toString() === userId.toString());

    if (existingArgument && existingArgument.side !== side) {
      const response: ApiResponse = {
        success: false,
        error: `You have already joined the ${existingArgument.side} side of this debate. You cannot switch sides or join both sides.`
      };
      return res.status(400).json(response);
    }

    if ((isInSupport && side !== 'support') || (isInOppose && side !== 'oppose')) {
      const currentSide = isInSupport ? 'support' : 'oppose';
      const response: ApiResponse = {
        success: false,
        error: `You have already joined the ${currentSide} side of this debate. You cannot switch sides or join both sides.`
      };
      return res.status(400).json(response);
    }

    if (!isInSupport && !isInOppose) {
      if (side === 'support') {
        debate.supportUsers.push(new mongoose.Types.ObjectId(userId));
      } else {
        debate.opposeUsers.push(new mongoose.Types.ObjectId(userId));
      }
      await debate.save();
    }

    const argument = new Argument({
      debateId,
      authorId: req.user._id,
      text,
      side
    });

    await argument.save();
    await argument.populate('authorId', 'name avatarUrl');

    const response: ApiResponse = {
      success: true,
      data: { argument },
      message: 'Argument created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/arguments/:id', validateObjectId, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const argument = await Argument.findById(req.params.id)
      .populate('authorId', 'name avatarUrl')
      .populate('debateId', 'title');

    if (!argument) {
      const response: ApiResponse = {
        success: false,
        error: 'Argument not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: { argument }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});


router.put('/arguments/:id', verifyFirebaseToken, validateObjectId, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const argument = await Argument.findById(req.params.id);

    if (!argument) {
      const response: ApiResponse = {
        success: false,
        error: 'Argument not found'
      };
      return res.status(404).json(response);
    }

    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required'
      };
      return res.status(401).json(response);
    }

    if (argument.authorId.toString() !== req.user._id.toString()) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authorized to update this argument'
      };
      return res.status(403).json(response);
    }

    const debate = await Debate.findById(argument.debateId);
    if (!debate || !debate.isActive || debate.isExpired()) {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot update argument for inactive or expired debate'
      };
      return res.status(400).json(response);
    }

    const EDIT_WINDOW_MS = 5 * 60 * 1000; 
    const argumentCreatedAt = new Date(argument.createdAt);
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - argumentCreatedAt.getTime();

    if (timeDifference > EDIT_WINDOW_MS) {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot update argument. Edit window (5 minutes) has expired.'
      };
      return res.status(400).json(response);
    }

    const allowedUpdates = ['text'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid updates. Only text can be updated.'
      };
      return res.status(400).json(response);
    }

    const updatedArgument = await Argument.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('authorId', 'name avatarUrl');

    const response: ApiResponse = {
      success: true,
      data: { argument: updatedArgument },
      message: 'Argument updated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});


router.delete('/arguments/:id', verifyFirebaseToken, validateObjectId, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const argument = await Argument.findById(req.params.id);

    if (!argument) {
      const response: ApiResponse = {
        success: false,
        error: 'Argument not found'
      };
      return res.status(404).json(response);
    }

    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required'
      };
      return res.status(401).json(response);
    }

    if (argument.authorId.toString() !== req.user._id.toString()) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authorized to delete this argument'
      };
      return res.status(403).json(response);
    }

    const debate = await Debate.findById(argument.debateId);
    if (!debate || !debate.isActive || debate.isExpired()) {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot delete argument for inactive or expired debate'
      };
      return res.status(400).json(response);
    }

    const EDIT_WINDOW_MS = 5 * 60 * 1000; 
    const argumentCreatedAt = new Date(argument.createdAt);
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - argumentCreatedAt.getTime();

    if (timeDifference > EDIT_WINDOW_MS) {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot delete argument. Edit window (5 minutes) has expired.'
      };
      return res.status(400).json(response);
    }

    await Argument.findByIdAndDelete(req.params.id);

    const response: ApiResponse = {
      success: true,
      message: 'Argument deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});


router.post('/arguments/:id/vote', verifyFirebaseToken, validateObjectId, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { voteType } = req.body; 
    
    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      const response: ApiResponse = {
        success: false,
        error: 'Vote type must be either "upvote" or "downvote"'
      };
      return res.status(400).json(response);
    }

    const argument = await Argument.findById(req.params.id);

    if (!argument) {
      const response: ApiResponse = {
        success: false,
        error: 'Argument not found'
      };
      return res.status(404).json(response);
    }

    const debate = await Debate.findById(argument.debateId);
    if (!debate || !debate.isActive || debate.isExpired()) {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot vote on argument for inactive or expired debate'
      };
      return res.status(400).json(response);
    }

    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required'
      };
      return res.status(401).json(response);
    }

    const userObjectId = new mongoose.Types.ObjectId(req.user._id);
    const userId = req.user._id.toString();

    const hasUpvoted = argument.upvotedBy?.some(id => id.toString() === userId);
    const hasDownvoted = argument.downvotedBy?.some(id => id.toString() === userId);
    
    let voteChange = 0;

    if (hasUpvoted) {
      argument.upvotedBy = argument.upvotedBy?.filter(id => id.toString() !== userId);
      argument.upvotes -= 1;
      voteChange -= 1;
    }
    if (hasDownvoted) {
      argument.downvotedBy = argument.downvotedBy?.filter(id => id.toString() !== userId);
      argument.downvotes -= 1;
      voteChange += 1; 
    }

    let action = '';
    
    if (voteType === 'upvote' && !hasUpvoted) {
      argument.upvotedBy = argument.upvotedBy || [];
      argument.upvotedBy.push(userObjectId);
      argument.upvotes += 1;
      voteChange += 1; 
      action = hasDownvoted ? 'switched to upvote' : 'upvoted';
    } else if (voteType === 'downvote' && !hasDownvoted) {
      argument.downvotedBy = argument.downvotedBy || [];
      argument.downvotedBy.push(userObjectId);
      argument.downvotes += 1;
      voteChange -= 1; 
      action = hasUpvoted ? 'switched to downvote' : 'downvoted';
    } else {
      action = voteType === 'upvote' ? 'removed upvote' : 'removed downvote';
    }

    if (voteChange !== 0) {
      await User.findByIdAndUpdate(argument.authorId, {
        $inc: { totalVotes: voteChange }
      });
    }

    await argument.save();
    await argument.populate('authorId', 'name avatarUrl');

    const currentUpvoted = argument.upvotedBy?.some(id => id.toString() === userId);
    const currentDownvoted = argument.downvotedBy?.some(id => id.toString() === userId);
    let userVote = null;
    if (currentUpvoted) userVote = 'upvote';
    else if (currentDownvoted) userVote = 'downvote';

    const response: ApiResponse = {
      success: true,
      data: { 
        argument: {
          ...argument.toJSON(),
          userVote
        },
        action
      },
      message: `Vote ${action} successfully`
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
