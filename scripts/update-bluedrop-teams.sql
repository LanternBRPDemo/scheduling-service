-- Update BlueDrop teams in scheduling_service

-- Set the BlueDrop tenant ID
\set BLUEDROP_TENANT_ID '08534641-bbdd-477e-a14b-e4c675e979ac'

-- First, let's see what teams employees have
SELECT DISTINCT team, COUNT(*) as employee_count
FROM user_service.employees
WHERE tenant_id = :'BLUEDROP_TENANT_ID'
  AND team IS NOT NULL
GROUP BY team
ORDER BY team;

-- Show employees by team
SELECT team, first_name, last_name, id
FROM user_service.employees
WHERE tenant_id = :'BLUEDROP_TENANT_ID'
  AND team IS NOT NULL
ORDER BY team, last_name, first_name;

-- Clear existing team members and teams for BlueDrop
DELETE FROM scheduling_service.team_members WHERE tenant_id = :'BLUEDROP_TENANT_ID';
DELETE FROM scheduling_service.teams WHERE tenant_id = :'BLUEDROP_TENANT_ID';

-- Insert Residential Service team
INSERT INTO scheduling_service.teams (tenant_id, name, description, color, lead_operator_id, created_at, updated_at)
SELECT
    :'BLUEDROP_TENANT_ID',
    'Residential Service',
    'Handles all residential service calls and installations',
    '#22c55e',  -- Green
    (SELECT id FROM user_service.employees WHERE tenant_id = :'BLUEDROP_TENANT_ID' AND team = 'Residential Service' ORDER BY last_name LIMIT 1),
    NOW(),
    NOW()
WHERE EXISTS (SELECT 1 FROM user_service.employees WHERE tenant_id = :'BLUEDROP_TENANT_ID' AND team = 'Residential Service');

-- Insert Commercial Service team
INSERT INTO scheduling_service.teams (tenant_id, name, description, color, lead_operator_id, created_at, updated_at)
SELECT
    :'BLUEDROP_TENANT_ID',
    'Commercial Service',
    'Specializes in commercial and business installations',
    '#3b82f6',  -- Blue
    (SELECT id FROM user_service.employees WHERE tenant_id = :'BLUEDROP_TENANT_ID' AND team = 'Commercial Service' ORDER BY last_name LIMIT 1),
    NOW(),
    NOW()
WHERE EXISTS (SELECT 1 FROM user_service.employees WHERE tenant_id = :'BLUEDROP_TENANT_ID' AND team = 'Commercial Service');

-- Insert General Service team
INSERT INTO scheduling_service.teams (tenant_id, name, description, color, lead_operator_id, created_at, updated_at)
SELECT
    :'BLUEDROP_TENANT_ID',
    'General Service',
    'Handles general service calls and maintenance',
    '#f59e0b',  -- Amber
    (SELECT id FROM user_service.employees WHERE tenant_id = :'BLUEDROP_TENANT_ID' AND team = 'General Service' ORDER BY last_name LIMIT 1),
    NOW(),
    NOW()
WHERE EXISTS (SELECT 1 FROM user_service.employees WHERE tenant_id = :'BLUEDROP_TENANT_ID' AND team = 'General Service');

-- Add team members for Residential Service
INSERT INTO scheduling_service.team_members (tenant_id, team_id, operator_id, role, joined_at)
SELECT
    :'BLUEDROP_TENANT_ID',
    t.id,
    e.id,
    CASE
        WHEN e.id = t.lead_operator_id THEN 'lead'
        ELSE 'member'
    END,
    NOW()
FROM user_service.employees e
JOIN scheduling_service.teams t ON t.name = e.team
WHERE e.tenant_id = :'BLUEDROP_TENANT_ID'
  AND e.team = 'Residential Service'
  AND t.tenant_id = :'BLUEDROP_TENANT_ID';

-- Add team members for Commercial Service
INSERT INTO scheduling_service.team_members (tenant_id, team_id, operator_id, role, joined_at)
SELECT
    :'BLUEDROP_TENANT_ID',
    t.id,
    e.id,
    CASE
        WHEN e.id = t.lead_operator_id THEN 'lead'
        ELSE 'member'
    END,
    NOW()
FROM user_service.employees e
JOIN scheduling_service.teams t ON t.name = e.team
WHERE e.tenant_id = :'BLUEDROP_TENANT_ID'
  AND e.team = 'Commercial Service'
  AND t.tenant_id = :'BLUEDROP_TENANT_ID';

-- Add team members for General Service
INSERT INTO scheduling_service.team_members (tenant_id, team_id, operator_id, role, joined_at)
SELECT
    :'BLUEDROP_TENANT_ID',
    t.id,
    e.id,
    CASE
        WHEN e.id = t.lead_operator_id THEN 'lead'
        ELSE 'member'
    END,
    NOW()
FROM user_service.employees e
JOIN scheduling_service.teams t ON t.name = e.team
WHERE e.tenant_id = :'BLUEDROP_TENANT_ID'
  AND e.team = 'General Service'
  AND t.tenant_id = :'BLUEDROP_TENANT_ID';

-- Show final results
SELECT
    t.name as team_name,
    t.color as team_color,
    COUNT(tm.id) as member_count,
    STRING_AGG(
        CONCAT(e.first_name, ' ', e.last_name,
               CASE WHEN tm.role = 'lead' THEN ' (Lead)' ELSE '' END),
        ', ' ORDER BY tm.role DESC, e.last_name
    ) as members
FROM scheduling_service.teams t
JOIN scheduling_service.team_members tm ON t.id = tm.team_id
JOIN user_service.employees e ON tm.operator_id = e.id
WHERE t.tenant_id = :'BLUEDROP_TENANT_ID'
GROUP BY t.name, t.color
ORDER BY t.name;