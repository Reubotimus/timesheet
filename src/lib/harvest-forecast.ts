// Harvest Forecast API client and types

export interface HarvestAssignment {
  id: number;
  person_id: number;
  project_id: number;
  start_date: string;
  end_date: string;
  allocation: number; // seconds
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

// Convert Harvest assignment to a task that can be dragged to calendar
export interface HarvestTaskItem {
  id: string;
  title: string;
  description: string;
  duration: number; // in hours
  color: string;
  projectName: string;
  clientName?: string;
  allocation: number;
  harvestData: HarvestAssignment;
}

class HarvestForecastClient {
  private baseUrl: string;
  private accountId: string;
  private accessToken: string;
  private userId: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_HARVEST_FORECAST_API_URL || 'https://api.forecastapp.com';
    this.accountId = process.env.NEXT_PUBLIC_HARVEST_FORECAST_ACCOUNT_ID || '';
    this.accessToken = process.env.NEXT_PUBLIC_HARVEST_FORECAST_ACCESS_TOKEN || '';
    this.userId = process.env.NEXT_PUBLIC_HARVEST_FORECAST_USER_ID || '';

    if (!this.accountId || !this.accessToken || !this.userId) {
      console.warn('Harvest Forecast credentials not properly configured');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Forecast-Account-ID': this.accountId,
      'Content-Type': 'application/json',
    };
  }

  private async fetchFromHarvest<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Harvest API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Harvest Forecast API error:', error);
      throw error;
    }
  }

  // Fetch assignments for the hardcoded user for a specific date range
  async getAssignments(startDate: string, endDate: string): Promise<HarvestAssignment[]> {
    const endpoint = `/assignments?start_date=${startDate}&end_date=${endDate}&person_id=${this.userId}`;
    const response = await this.fetchFromHarvest<{ assignments: HarvestAssignment[] }>(endpoint);
    return response.assignments || [];
  }

  // Fetch projects to get project details
  async getProjects(): Promise<HarvestProject[]> {
    const response = await this.fetchFromHarvest<{ projects: HarvestProject[] }>('/projects');
    return response.projects || [];
  }

  // Fetch clients for additional context
  async getClients(): Promise<HarvestClient[]> {
    const response = await this.fetchFromHarvest<{ clients: HarvestClient[] }>('/clients');
    return response.clients || [];
  }

  // Convert assignments to draggable task items
  async getTaskItems(date: Date): Promise<HarvestTaskItem[]> {
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      // Fetch assignments for the selected date
      const assignments = await this.getAssignments(dateStr, dateStr);
      
      // Fetch projects and clients for context
      const [projects, clients] = await Promise.all([
        this.getProjects(),
        this.getClients()
      ]);

      // Create lookup maps
      const projectMap = new Map(projects.map(p => [p.id, p]));
      const clientMap = new Map(clients.map(c => [c.id, c]));

      // Convert assignments to task items
      return assignments.map((assignment): HarvestTaskItem => {
        const project = projectMap.get(assignment.project_id);
        const client = project ? clientMap.get(project.client_id) : undefined;

        return {
          id: `harvest-${assignment.id}`,
          title: project?.name || 'Unknown Project',
          description: assignment.notes || `${Math.round(assignment.allocation / 3600 * 100) / 100}h scheduled`,
          duration: assignment.allocation / 3600, // Convert seconds to hours
          color: project?.color || '#3B82F6', // Default blue
          projectName: project?.name || 'Unknown Project',
          clientName: client?.name,
          allocation: assignment.allocation / 3600, // Convert seconds to hours
          harvestData: assignment,
        };
      });
    } catch (error) {
      console.error('Failed to fetch Harvest tasks:', error);
      return [];
    }
  }
}

export const harvestClient = new HarvestForecastClient(); 