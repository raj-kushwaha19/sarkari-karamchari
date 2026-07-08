const { z } = require('zod');

const complaintSchema = z.object({
  department: z.string().min(1, 'Department is required').max(200),
  pinCode: z.string().length(6, 'PIN code must be 6 digits').regex(/^\d+$/, 'PIN code must be numeric'),
  exactAddress: z.string().optional().default(''),
  description: z.object({
    raw: z.string().min(10, 'Complaint must be at least 10 characters').max(5000, 'Complaint is too long'),
    aiFormatted: z.string().optional().default(''),
  }),
});

const pinCodeSchema = z.string().length(6, 'PIN code must be 6 digits').regex(/^\d+$/, 'PIN code must be numeric');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({
      error: 'Invalid input',
      details: err.errors ? err.errors.map(e => e.message) : ['Validation failed'],
    });
  }
};

module.exports = { complaintSchema, pinCodeSchema, validate };
