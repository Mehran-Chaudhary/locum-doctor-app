import axios from 'axios';

/**
 * Extract a human-readable error message from an API error.
 * Handles Axios errors, validation arrays, and generic JS errors.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data?.message) {
      if (Array.isArray(data.message)) {
        return data.message.join('\n');
      }
      return data.message;
    }

    if (error.code === 'ERR_NETWORK') {
      return 'No internet connection. Please check your network and try again.';
    }

    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    // HTTP status fallback
    const status = error.response?.status;
    if (status === 500) return 'Server error. Please try again later.';
    if (status === 503) return 'Service unavailable. Please try again later.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Extract the HTTP status code from an error.
 */
export function getErrorStatus(error: unknown): number | null {
  if (axios.isAxiosError(error)) {
    return error.response?.status ?? null;
  }
  return null;
}
