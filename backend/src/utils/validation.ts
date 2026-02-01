import { z } from 'zod';

export const validateProjectData = (data: any) => {
  const schema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(500).nullable().optional().or(z.literal('')),
    location: z.string().min(2).max(200),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    areaHectares: z.number().min(0.1).max(10000),
    ecosystemType: z.enum(['MANGROVE', 'SEAGRASS', 'SALT_MARSH', 'KELP']),
    documentIds: z.array(z.string()).optional()
  });

  return schema.safeParse(data);
};

export const validateUserRegistration = (data: any) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(128),
    name: z.string().min(2).max(100),
    organizationName: z.string().min(2).max(200).optional(),
    role: z.enum(['NGO', 'PANCHAYAT', 'COMMUNITY', 'RESEARCHER'])
  });

  return schema.safeParse(data);
};

export const validateUserLogin = (data: any) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string()
  });

  return schema.safeParse(data);
};

export const validateTokenTransaction = (data: any) => {
  const schema = z.object({
    amount: z.number().min(1).max(10000),
    pricePerToken: z.number().min(0.01).optional()
  });

  return schema.safeParse(data);
};

export const validateCreditIssuance = (data: any) => {
  const schema = z.object({
    amount: z.number().min(1).max(100000),
    verificationData: z.object({
      methodology: z.string(),
      measurements: z.array(z.any()),
      inspector: z.string(),
      date: z.string().or(z.date())
    })
  });

  return schema.safeParse(data);
};
