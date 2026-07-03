#!/bin/bash
curl -X POST "http://localhost:4015/api/schedules/assignments" \
  -H "x-tenant-id: 08534641-bbdd-477e-a14b-e4c675e979ac" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440001" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": "d24a15df-6a71-52c0-9cb9-a7e4bc0b2628",
    "operator_id": "550e8400-e29b-41d4-a716-446655440001",
    "team_id": "074aba1c-634b-4354-bd27-ea08d08fb197",
    "scheduled_start": "2024-01-17T14:00:00.000Z",
    "scheduled_end": "2024-01-17T16:00:00.000Z"
  }'