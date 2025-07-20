import express, { Request, Response, NextFunction } from 'express';
import Debate from '@/models/Debate';
import User from '@/models/User';
import { verifyFirebaseToken, optionalFirebaseAuth, AuthenticatedRequest } from '@/middleware/firebaseAuth';
import { validateDebateCreation, validateObjectId, validatePagination } from '@/middleware/validation';
import { ApiResponse, DebateFilters } from '@/types';

const router = express.Router();


router.get('/', validatePagination, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      category,
      tags,
      search,
      isActive
    } = req.query as DebateFilters;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    // ---------------------------filter object---------------------
    const filter: any = {};

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

    const debates = await Debate.find(filter)
      .populate('creatorId', 'name avatarUrl')
      .sort({ [sort!]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const total = await Debate.countDocuments(filter);

    const response: ApiResponse = {
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
  } catch (error) {
    next(error);
  }
});


router.get('/:id', validateObjectId, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('creatorId', 'name avatarUrl');

    if (!debate) {
      const response: ApiResponse = {
        success: false,
        error: 'Debate not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: { debate }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/', verifyFirebaseToken, validateDebateCreation, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'User authentication required'
      };
      return res.status(401).json(response);
    }

    const { title, description, category, tags, duration, imageUrl } = req.body;

    const debate = new Debate({
      title,
      description,
      category,
      tags: tags || [],
      duration,
      imageUrl: imageUrl || 'https://placehold.co/600x400.png',
      creatorId: req.user._id
    });

    await debate.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { debatesParticipated: 1 }
    });

    await debate.populate('creatorId', 'name avatarUrl');

    const response: ApiResponse = {
      success: true,
      data: { debate },
      message: 'Debate created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', verifyFirebaseToken, validateObjectId, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'User authentication required'
      };
      return res.status(401).json(response);
    }

    const debate = await Debate.findById(req.params.id);

    if (!debate) {
      const response: ApiResponse = {
        success: false,
        error: 'Debate not found'
      };
      return res.status(404).json(response);
    }

    if (debate.creatorId.toString() !== req.user._id.toString()) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authorized to update this debate'
      };
      return res.status(403).json(response);
    }

    if (debate.isExpired()) {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot update expired debate'
      };
      return res.status(400).json(response);
    }

    const allowedUpdates = ['title', 'description', 'tags', 'imageUrl', 'isActive'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid updates'
      };
      return res.status(400).json(response);
    }

    const updatedDebate = await Debate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('creatorId', 'name avatarUrl');

    const response: ApiResponse = {
      success: true,
      data: { debate: updatedDebate },
      message: 'Debate updated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});


router.delete('/:id', verifyFirebaseToken, validateObjectId, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'User authentication required'
      };
      return res.status(401).json(response);
    }

    const debate = await Debate.findById(req.params.id);

    if (!debate) {
      const response: ApiResponse = {
        success: false,
        error: 'Debate not found'
      };
      return res.status(404).json(response);
    }

    if (debate.creatorId.toString() !== req.user._id.toString()) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authorized to delete this debate'
      };
      return res.status(403).json(response);
    }

    await Debate.findByIdAndDelete(req.params.id);

    const response: ApiResponse = {
      success: true,
      message: 'Debate deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = ['Technology', 'Politics', 'Science', 'Social', 'Economics', 'Environment', 'Sports', 'Entertainment', 'Other'];
    
    const response: ApiResponse = {
      success: true,
      data: { categories }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
