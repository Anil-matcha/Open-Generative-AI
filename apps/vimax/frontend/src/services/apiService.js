/**
 * ViMax API Service - Stub for RED phase
 * Functions throw errors to indicate unimplemented.
 */
export function getApiBaseUrl() {
  // Implementation pending
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
}

export function getGenerateVideoUrl() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/functions/v1/generate-video-proxy`;
  }
  return `${getApiBaseUrl()}/generate-video`;
}

export function getEnhanceTextUrl() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/functions/v1/enhance-text`;
  }
  return `${getApiBaseUrl()}/enhance-text`;
}

export async function enhanceText(text, pipeline) {
  // Not yet implemented
  throw new Error('enhanceText is not implemented');
}

export async function generateVideo(formData) {
  // Not yet implemented
  throw new Error('generateVideo is not implemented');
}

export async function getJobStatus(jobId) {
  // Not yet implemented
  throw new Error('getJobStatus is not implemented');
}
