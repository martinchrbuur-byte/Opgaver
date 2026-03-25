import Joi from 'joi';

export const createChoreSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('one-time', 'recurring').default('one-time'),
  frequency: Joi.when('type', {
    is: 'recurring',
    then: Joi.string().valid('daily', 'weekly', 'monthly').required(),
    otherwise: Joi.string().optional(),
  }),
  dueDate: Joi.date().iso().optional(),
  reward: Joi.number().min(0).max(1000).default(0),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  assignedTo: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

export const updateChoreSchema = Joi.object({
  title: Joi.string().min(1).max(100).optional(),
  status: Joi.string().valid('active', 'pending_approval', 'approved', 'rejected').optional(),
  rejectionReason: Joi.string().max(255).optional(),
  reward: Joi.number().min(0).max(1000).optional(),
  assignedTo: Joi.array().items(Joi.string().uuid()).optional(),
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
