export interface ScheduleAssignment {
  id: string;
  tenant_id: string;
  appointment_id: string; // References manufacturing_service.appointments
  operator_id: string; // References user_service employee
  team_id?: string;
  scheduled_start: Date;
  scheduled_end: Date;
  actual_start?: Date;
  actual_end?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
}

export interface OperatorAvailability {
  id: string;
  operator_id: string;
  tenant_id: string;
  date: Date;
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  is_available: boolean;
  reason?: string; // If not available
  created_at: Date;
  updated_at: Date;
}

export interface ScheduleView {
  appointment_id: string;
  appointment_number: string;
  customer_name: string;
  job_description: string;
  operator_id: string;
  operator_name: string;
  team_id?: string;
  team_name?: string;
  team_color?: string;
  scheduled_start: Date;
  scheduled_end: Date;
  status: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}