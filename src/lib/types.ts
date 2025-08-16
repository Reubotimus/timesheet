export interface HarvestAssignment {
  id: number;
  person_id: number;
  project_id: number;
  start_date: string;
  end_date: string;
  allocation: number;
  notes?: string;
  project?: HarvestProject;
  active_on_days_off: boolean;
}

export interface HarvestProject {
  id: number;
  name: string;
  client_id: number;
  color?: string;
  code?: string;
  client?: HarvestClient;
}

export interface HarvestClient {
  id: number;
  name: string;
}

export interface HarvestPerson {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface HarvestTaskItem {
  id: string;
  title: string;
  description: string;
  duration: number;
  color: string;
  projectName: string;
  clientName?: string;
  allocation: number;
  harvestData: HarvestAssignment;
}
