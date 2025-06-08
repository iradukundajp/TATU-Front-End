import { storage } from './auth.service';

// Get the base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Constants for storage keys
const TOKEN_KEY = 'tatu_auth_token';

/**
 * API error class for consistent error handling
 */
export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Configuration options for API requests
 */
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  params?: Record<string, any>;
}

/**
 * Get auth token from storage
 */
const getToken = async (): Promise<string | null> => {
  return await storage.getItem(TOKEN_KEY);
};

/**
 * Make an API request
 * @param endpoint - The API endpoint (without base URL)
 * @param options - Request options
 * @returns Promise with the response data
 */
export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, params, ...fetchOptions } = options;
  
  // Check if base URL is configured
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL is not configured. Please check your environment variables.');
  }

  // Build the full URL with query parameters if provided
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    url += `?${queryParams.toString()}`;
  }

  // Set default headers
  const headers = new Headers(fetchOptions.headers);
  
  // Don't set Content-Type for FormData (browser will set it with boundary)
  const isFormData = fetchOptions.body instanceof FormData;
  
  // Always set Content-Type for requests with a body unless it's FormData
  if (!headers.has('Content-Type') && !isFormData && (fetchOptions.body || fetchOptions.method === 'POST' || fetchOptions.method === 'PUT' || fetchOptions.method === 'PATCH')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add authorization token if required
  if (requiresAuth) {
    const token = await getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else if (requiresAuth) {
      // If authentication is required but no token is available
      throw new ApiError('Authentication required', 401);
    }
  }

  // Log request for debugging
  console.log(`API Request: ${fetchOptions.method || 'GET'} ${endpoint}`);
  if (fetchOptions.body) {
    console.log('Request body:', fetchOptions.body);
  }

  // Don't stringify FormData
  let body = fetchOptions.body;
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    body = JSON.stringify(body);
  }

  // Make the request
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      body,
      headers,
    });

    // Parse the response
    let data;
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Log response for debugging
    console.log(`API Response (${response.status}):`, data);

    // Handle error responses
    if (!response.ok) {
      throw new ApiError(
        data.message || `API error: ${response.status}`,
        response.status,
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, options: RequestOptions = {}) => 
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, data: any, options: RequestOptions = {}) => {
    // Don't stringify FormData
    if (data instanceof FormData) {
      return apiRequest<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data,
      });
    }
    
    // For regular JSON data
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, data: any, options: RequestOptions = {}) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * PATCH request
   */
  patch: <T = any>(endpoint: string, data: any, options: RequestOptions = {}) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, options: RequestOptions = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  /**
   * Upload a custom tattoo image
   * @param endpoint - The API endpoint (should be '/profile/custom-tattoo')
   * @param formData - The FormData object containing the image
   * @param options - Request options
   * @returns Promise with the response data (filePath, filename)
   */
  uploadFile: async <T = any>(endpoint: string, formData: FormData, options: RequestOptions = {}): Promise<T> => {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL is not configured. Please check your environment variables.');
    }
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = new Headers(options.headers);
    if (options.requiresAuth !== false) { // Default to true if not specified
      const token = await getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      } else {
        throw new ApiError('Authentication required for file upload', 401);
      }
    }

    // Do not set Content-Type for FormData, browser will do it with boundary
    // headers.delete('Content-Type'); 

    console.log(`API File Upload: POST ${endpoint}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
        ...options, // Spread other options like signal for cancellation
      });

      let data;
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text(); // Or handle as blob/arrayBuffer if needed
      }

      console.log(`API File Upload Response (${response.status}):`, data);

      if (!response.ok) {
        throw new ApiError(
          (data as any)?.message || `API error: ${response.status}`,
          response.status,
          data
        );
      }
      return data as T;
    } catch (error) {
      console.error('File upload error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error during file upload',
        500
      );
    }
  }
};