import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { createError } from './errorHandler';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    const error = createError(`Validation failed: ${errorMessages.join(', ')}`, 400);
    return next(error);
  }
  next();
};

export const validateRequest = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    handleValidationErrors(req, res, next);
  };
};