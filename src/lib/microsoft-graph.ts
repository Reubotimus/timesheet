// Microsoft Graph API client for accessing user emails and extracting Harvest user ID

export interface MicrosoftUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

class MicrosoftGraphClient {
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(private accessToken: string) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async fetchFromGraph<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(): Promise<MicrosoftUser> {
    return this.fetchFromGraph<MicrosoftUser>('/me');
  }

  async getUserEmail(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      
      const email = user.mail || user.userPrincipalName;
      
      if (email) {
        return email;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }
}

export { MicrosoftGraphClient };
