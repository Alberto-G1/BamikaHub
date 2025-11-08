-- ============================================
-- Assignments Module - Permission Setup
-- ============================================
-- This script adds the necessary permissions for the Assignments module
-- Run this script after deploying the Assignments module

-- Step 1: Add Assignment Permissions
-- ============================================

INSERT INTO permission (name, description, created_at, updated_at)
VALUES
    ('ASSIGNMENT_READ', 'View and track assigned tasks', NOW(), NOW()),
    ('ASSIGNMENT_CREATE', 'Create and assign tasks to team members', NOW(), NOW()),
    ('ASSIGNMENT_UPDATE', 'Edit and modify assignments', NOW(), NOW()),
    ('ASSIGNMENT_DELETE', 'Delete assignments', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    updated_at = NOW();

-- Step 2: Assign Permissions to Roles
-- ============================================

-- Option 1: Assign to specific roles by name
-- Adjust role names according to your system

-- For ADMIN role (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM role r 
CROSS JOIN permission p
WHERE r.name = 'ADMIN' 
  AND p.name IN ('ASSIGNMENT_READ', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_UPDATE', 'ASSIGNMENT_DELETE')
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp 
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- For MANAGER role (create, read, update, delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM role r 
CROSS JOIN permission p
WHERE r.name = 'MANAGER' 
  AND p.name IN ('ASSIGNMENT_READ', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_UPDATE', 'ASSIGNMENT_DELETE')
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp 
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- For TEAM_LEADER role (create, read, update)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM role r 
CROSS JOIN permission p
WHERE r.name = 'TEAM_LEADER' 
  AND p.name IN ('ASSIGNMENT_READ', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_UPDATE')
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp 
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- For TEAM_MEMBER role (read only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM role r 
CROSS JOIN permission p
WHERE r.name = 'TEAM_MEMBER' 
  AND p.name = 'ASSIGNMENT_READ'
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp 
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- For EMPLOYEE role (read only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM role r 
CROSS JOIN permission p
WHERE r.name = 'EMPLOYEE' 
  AND p.name = 'ASSIGNMENT_READ'
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp 
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Step 3: Verify Permissions
-- ============================================

-- Check if permissions were created
SELECT * FROM permission WHERE name LIKE 'ASSIGNMENT_%';

-- Check role-permission mappings
SELECT 
    r.name AS role_name,
    p.name AS permission_name,
    p.description AS permission_description
FROM role r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permission p ON rp.permission_id = p.id
WHERE p.name LIKE 'ASSIGNMENT_%'
ORDER BY r.name, p.name;

-- ============================================
-- Optional: Manual Assignment to Specific Users
-- ============================================

-- If you want to grant permissions to specific users directly
-- (Usually permissions are managed through roles, but this is for special cases)

-- Example: Grant ASSIGNMENT_CREATE to a specific user
-- UNCOMMENT and modify the user_id as needed:

-- INSERT INTO user_permissions (user_id, permission_id)
-- SELECT 123, p.id -- Replace 123 with actual user ID
-- FROM permission p
-- WHERE p.name = 'ASSIGNMENT_CREATE'
--   AND NOT EXISTS (
--       SELECT 1 FROM user_permissions up 
--       WHERE up.user_id = 123 AND up.permission_id = p.id
--   );

-- ============================================
-- Rollback Script (Use with caution!)
-- ============================================

-- UNCOMMENT THE FOLLOWING LINES TO REMOVE THE ASSIGNMENTS MODULE PERMISSIONS

-- DELETE FROM role_permissions 
-- WHERE permission_id IN (
--     SELECT id FROM permission WHERE name LIKE 'ASSIGNMENT_%'
-- );

-- DELETE FROM user_permissions 
-- WHERE permission_id IN (
--     SELECT id FROM permission WHERE name LIKE 'ASSIGNMENT_%'
-- );

-- DELETE FROM permission WHERE name LIKE 'ASSIGNMENT_%';

-- ============================================
-- End of Script
-- ============================================

COMMIT;
