-- VaultGuard Database Initialization Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if it doesn't exist (this is handled by Docker)
-- The database is created automatically by the POSTGRES_DB environment variable

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE vaultguard TO vaultguard;

-- Create schema if needed (optional, using public schema by default)
-- CREATE SCHEMA IF NOT EXISTS vaultguard;

-- Note: Tables will be created automatically by Drizzle ORM migrations
-- when the application starts up

-- Create indexes for better performance (these will be created by Drizzle as well)
-- But we can add additional performance optimizations here if needed

-- Set up connection limits and other database-level configurations
ALTER DATABASE vaultguard SET log_statement = 'all';
ALTER DATABASE vaultguard SET log_min_duration_statement = 1000;

-- Create a read-only user for monitoring/backup purposes (optional)
-- CREATE USER vaultguard_readonly WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE vaultguard TO vaultguard_readonly;
-- GRANT USAGE ON SCHEMA public TO vaultguard_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO vaultguard_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO vaultguard_readonly;
