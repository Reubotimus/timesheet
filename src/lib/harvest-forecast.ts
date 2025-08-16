import { HarvestAssignment, HarvestTaskItem } from '@/lib/types';

class HarvestForecastClient {
  private baseUrl: string;
  private accountId: string;
  private accessToken: string;
  private userId: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_HARVEST_FORECAST_API_URL || 'https://api.forecastapp.com';
    this.accountId = process.env.NEXT_PUBLIC_HARVEST_FORECAST_ACCOUNT_ID || '';
    this.accessToken = process.env.NEXT_PUBLIC_HARVEST_FORECAST_ACCESS_TOKEN || '';
    
    if (typeof window !== 'undefined') {
      const savedUserId = localStorage.getItem('harvest_user_id');
      if (savedUserId) {
        this.userId = savedUserId;
      }
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('harvest_user_id', userId);
    }
  }

  async findUserIdByEmail(email: string): Promise<string | null> {
    if (!this.accountId || !this.accessToken) {
      return null;
    }

    try {
      const peopleResponse = await this.fetchFromHarvest<{ people: any[] }>('/people');
      const people = peopleResponse.people || [];
      
      const matchingPerson = people.find(person => 
        person.email && person.email.toLowerCase() === email.toLowerCase()
      );
      
      if (matchingPerson) {
        return matchingPerson.id.toString();
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  getUserId(): string | null {
    return this.userId;
  }

  isConfigured(): boolean {
    return !!(this.accountId && this.accessToken && this.userId);
  }

  private async fetchFromHarvest<T>(endpoint: string): Promise<T> {
    if (!this.accountId || !this.accessToken) {
      throw new Error('Harvest Forecast not configured. Please set account ID and access token.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Forecast-Account-ID': this.accountId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Harvest Forecast API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getAssignments(): Promise<HarvestAssignment[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await this.fetchFromHarvest<{ assignments: HarvestAssignment[] }>('/assignments');
      return response.assignments || [];
    } catch (error) {
      return [];
    }
  }

  async getTaskItems(): Promise<HarvestTaskItem[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await this.fetchFromHarvest<{ task_assignments: HarvestTaskItem[] }>('/task_assignments');
      return response.task_assignments || [];
    } catch (error) {
      return [];
    }
  }
}

export const harvestClient = new HarvestForecastClient(); 