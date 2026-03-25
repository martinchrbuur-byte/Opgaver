import Joi from 'joi';

export const createChildSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  ageRange: Joi.string().valid('5-7', '8-10', '11-13', '14+').optional(),
  pin: Joi.string().length(4).pattern(/^\d+$/).optional(),
});

export const updateChildSchema = Joi.object({
  name: Joi.string().min(1).max(50).optional(),
  ageRange: Joi.string().valid('5-7', '8-10', '11-13', '14+').optional(),
  pin: Joi.string().length(4).pattern(/^\d+$/).optional(),
}).min(1);

export function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((d) => d.message),
      });
    }
    next();
  };
}
