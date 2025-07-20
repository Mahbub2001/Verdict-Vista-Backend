"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePagination = exports.validateDebateId = exports.validateObjectId = exports.validateArgumentCreation = exports.validateDebateCreation = exports.validateLogin = exports.validateRegister = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        console.log("Validation errors:", JSON.stringify(errors.array(), null, 2));
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        const response = {
            success: false,
            error: "Validation failed",
            data: errors.array(),
        };
        res.status(400).json(response);
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.validateRegister = [
    (0, express_validator_1.body)("name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters"),
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    exports.handleValidationErrors,
];
exports.validateLogin = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
    exports.handleValidationErrors,
];
exports.validateDebateCreation = [
    (0, express_validator_1.body)("title")
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage("Title must be between 5 and 200 characters"),
    (0, express_validator_1.body)("description")
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage("Description must be between 10 and 1000 characters"),
    (0, express_validator_1.body)("category")
        .isIn([
        "Technology",
        "Politics",
        "Science",
        "Social",
        "Economics",
        "Environment",
        "Sports",
        "Entertainment",
        "Other",
    ])
        .withMessage("Invalid category"),
    (0, express_validator_1.body)("tags").optional().isArray().withMessage("Tags must be an array"),
    (0, express_validator_1.body)("duration")
        .isInt({ min: 3600, max: 604800 })
        .withMessage("Duration must be between 1 hour and 1 week (in seconds)"),
    exports.handleValidationErrors,
];
exports.validateArgumentCreation = [
    (0, express_validator_1.body)("text")
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage("Argument text must be between 10 and 1000 characters"),
    (0, express_validator_1.body)("side")
        .isIn(["support", "oppose"])
        .withMessage('Side must be either "support" or "oppose"'),
    exports.handleValidationErrors,
];
exports.validateObjectId = [
    (0, express_validator_1.param)("id").isMongoId().withMessage("Invalid ID format"),
    exports.handleValidationErrors,
];
exports.validateDebateId = [
    (0, express_validator_1.param)("debateId").isMongoId().withMessage("Invalid debate ID format"),
    exports.handleValidationErrors,
];
exports.validatePagination = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    (0, express_validator_1.query)("sort")
        .optional()
        .isIn(["createdAt", "votes", "title", "totalVotes"])
        .withMessage("Invalid sort field"),
    (0, express_validator_1.query)("order")
        .optional()
        .isIn(["asc", "desc"])
        .withMessage('Order must be "asc" or "desc"'),
    exports.handleValidationErrors,
];
//# sourceMappingURL=validation.js.map