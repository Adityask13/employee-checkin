// Utility functions for handling API calls with CORS and error handling

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
}

export const makeApiRequest = async (
  baseUrl: string,
  config: ApiRequestConfig
): Promise<unknown> => {
  try {
    // Build URL with query parameters
    let url = baseUrl;
    if (config.queryParams) {
      const params = new URLSearchParams(config.queryParams);
      url += `?${params.toString()}`;
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add any other headers that might help with CORS
        'X-Requested-With': 'XMLHttpRequest',
      },
      mode: 'cors',
      credentials: 'omit', // Don't send cookies for CORS
    };

    // Add body for non-GET requests
    if (config.body && config.method !== 'GET') {
      fetchOptions.body = JSON.stringify(config.body);
    }

    // Make the request
    const response = await fetch(url, fetchOptions);

    // Handle non-200 responses
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      // Try to get error details from response
      try {
        const errorData = await response.text();
        if (errorData) {
          errorMessage += ` - ${errorData}`;
        }
      } catch {
        // Ignore parsing errors
      }
      
      throw new Error(errorMessage);
    }

    // Parse JSON response
    const data = await response.json();
    return data;

  } catch (error) {
    // Enhanced error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    } else if (error instanceof Error && error.message.includes('CORS')) {
      throw new Error('CORS error: The server needs to allow cross-origin requests.');
    } else {
      throw error;
    }
  }
};

// Test function to check API connectivity
export const testApiConnection = async (baseUrl: string): Promise<boolean> => {
  try {
    await makeApiRequest(baseUrl, { method: 'GET' });
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};
