import Joi from 'joi';

export const validateProjectData = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    location: Joi.string().min(5).max(200).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    areaHectares: Joi.number().min(0.1).max(10000).required(),
    ecosystemType: Joi.string().valid('MANGROVE', 'SEAGRASS', 'SALT_MARSH', 'KELP').required()
  });

  return schema.validate(data);
};

export const validateUserRegistration = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    name: Joi.string().min(2).max(100).required(),
    organizationName: Joi.string().min(2).max(200).optional(),
    role: Joi.string().valid('NGO', 'PANCHAYAT', 'COMMUNITY', 'RESEARCHER').required()
  });

  return schema.validate(data);
};

export const validateUserLogin = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};

export const validateTokenTransaction = (data: any) => {
  const schema = Joi.object({
    amount: Joi.number().min(1).max(10000).required(),
    pricePerToken: Joi.number().min(0.01).optional()
  });

  return schema.validate(data);
};

export const validateCreditIssuance = (data: any) => {
  const schema = Joi.object({
    amount: Joi.number().min(1).max(100000).required(),
    verificationData: Joi.object({
      methodology: Joi.string().required(),
      measurements: Joi.array().required(),
      inspector: Joi.string().required(),
      date: Joi.date().required()
    }).required()
  });

  return schema.validate(data);
};
