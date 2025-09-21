-- Initialize Blue Carbon MRV Database
CREATE DATABASE IF NOT EXISTS blue_carbon_mrv;

-- Create extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- This file is run automatically when the PostgreSQL container starts
-- The actual schema is managed by Prisma migrations