export const USER_ROLES = {
  ADMIN: 'ADMIN',
  VERIFIER: 'VERIFIER',
  NGO: 'NGO',
  PANCHAYAT: 'PANCHAYAT',
  COMMUNITY: 'COMMUNITY',
  RESEARCHER: 'RESEARCHER'
} as const;

export const PROJECT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED'
} as const;

export const ECOSYSTEM_TYPES = {
  MANGROVE: 'MANGROVE',
  SEAGRASS: 'SEAGRASS',
  SALT_MARSH: 'SALT_MARSH',
  KELP: 'KELP'
} as const;

export const TOKEN_TRANSACTION_TYPES = {
  MINT: 'mint',
  TRANSFER: 'transfer',
  BURN: 'burn',
  BUY: 'buy',
  SELL: 'sell'
} as const;

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
} as const;

export const CARBON_CREDIT_RATES = {
  [ECOSYSTEM_TYPES.MANGROVE]: 10, // credits per hectare per year
  [ECOSYSTEM_TYPES.SEAGRASS]: 8,
  [ECOSYSTEM_TYPES.SALT_MARSH]: 6,
  [ECOSYSTEM_TYPES.KELP]: 5
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];