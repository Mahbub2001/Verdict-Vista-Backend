import express, { Request, Response, NextFunction } from 'express';
import User from '@/models/User';
import Argument from '@/models/Argument';
import { authenticate } from '@/middleware/auth';
import { validateObjectId, validatePagination } from '@/middleware/validation';
import { ApiResponse, PaginationQuery, AuthenticatedRequest } from '@/types';

const router = express.Router();


router.get('/', validatePagination, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'totalVotes',
      order = 'desc'
    } = req.query as PaginationQuery;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const users = await User.find()
      .sort({ [sort!]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments();

    const response: ApiResponse = {
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
  } catch (error) {
    next(error);
  }
});


router.get('/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'all-time', limit = 50 } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }
    
    if (period === 'weekly' || period === 'monthly') {
      const leaderboard = await User.aggregate([
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
          $limit: parseInt(limit as string)
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

      const response: ApiResponse = {
        success: true,
        data: leaderboard
      };

      res.json(response);
    } else {
      const users = await User.find()
        .sort({ totalVotes: -1 })
        .limit(parseInt(limit as string))
        .select('name avatarUrl totalVotes debatesParticipated');

      const response: ApiResponse = {
        success: true,
        data: users
      };

      res.json(response);
    }
  } catch (error) {
    next(error);
  }
});


router.get('/:id', validateObjectId, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: { user }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});


router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const response: ApiResponse = {
      success: true,
      data: { user: req.user }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});


router.put('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allowedUpdates = ['name', 'avatarUrl'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid updates. Only name and avatarUrl can be updated.'
      };
      res.status(400).json(response);
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true, runValidators: true }
    );

    const response: ApiResponse = {
      success: true,
      data: { user },
      message: 'Profile updated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
