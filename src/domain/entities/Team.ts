export interface Team {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  color: string; // Hex color for UI display
  lead_operator_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: string;
  team_id: string;
  operator_id: string; // References user_service employee
  role: 'lead' | 'member';
  joined_at: Date;
  created_at: Date;
  updated_at: Date;
}