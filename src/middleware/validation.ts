import { Request, Response, NextFunction } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { ApiResponse } from '@/types';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation failed',
      data: errors.array()
    };
    res.status(400).json(response);
    return;
  }
  next();
};

export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

export const validateDebateCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn(['Technology', 'Politics', 'Science', 'Social', 'Economics', 'Environment', 'Sports', 'Entertainment', 'Other'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('duration')
    .isInt({ min: 3600, max: 604800 })
    .withMessage('Duration must be between 1 hour and 1 week (in seconds)'),
  handleValidationErrors
];

export const validateArgumentCreation = [
  body('text')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Argument text must be between 10 and 1000 characters'),
  body('side')
    .isIn(['support', 'oppose'])
    .withMessage('Side must be either "support" or "oppose"'),
  handleValidationErrors
];

export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

export const validateDebateId = [
  param('debateId')
    .isMongoId()
    .withMessage('Invalid debate ID format'),
  handleValidationErrors
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', 'votes', 'title', 'totalVotes'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be "asc" or "desc"'),
  handleValidationErrors
];
