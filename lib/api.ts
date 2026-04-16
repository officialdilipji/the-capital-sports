
/**
 * Utility for making safe API calls with retry logic for the "Starting Server" state
 */

export async function safeFetch(url: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
  try {
    const res = await fetch(url, options);
    
    // Check if the response is HTML instead of JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      
      // If we get the "Starting Server" page, retry after a short delay
      if (text.includes('Starting Server...') && retryCount < 10) {
        console.log(`Server starting, retrying in 2s... (Attempt ${retryCount + 1}/10)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return safeFetch(url, options, retryCount + 1);
      }
      
      // If it's not JSON and not the starting page, it's an error
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      throw new Error('Invalid response from server (not JSON)');
    }
    
    return res;
  } catch (error) {
    if (retryCount < 10 && error instanceof Error && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
      console.log(`Network error, retrying in 2s... (Attempt ${retryCount + 1}/10)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return safeFetch(url, options, retryCount + 1);
    }
    throw error;
  }
}

export async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await safeFetch(url, options);
  return res.json();
}
