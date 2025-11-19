-- Migration: update email_templates.body column type to support LONG HTML templates
-- This is a manual SQL script. Run it against your database as appropriate.
-- MySQL / MariaDB
-- ALTER TABLE email_templates MODIFY COLUMN body LONGTEXT NOT NULL;

-- PostgreSQL
-- ALTER TABLE email_templates ALTER COLUMN body TYPE TEXT;

-- SQL Server
-- ALTER TABLE email_templates ALTER COLUMN body NVARCHAR(MAX);

-- Note:
-- - If you're using a migration tool like Flyway or Liquibase, convert this into a proper migration file in your migration folder.
-- - If you have a production database, ensure you back it up before running DDL changes.
