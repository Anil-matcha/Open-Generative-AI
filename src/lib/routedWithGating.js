import { isFeatureUnlocked, getRequiredTier } from './featureFlags';
import { getSubscription } from './subscriptionService';

const ROUTE_FEATURE_MAP = {
  'timeline': 'timeline-editor',
  'director': 'director-editing',
  'image': 'ai-image-generation',
  'video': 'ai-video-generation',
};

export async function navigateWithGating(page, params = {}) {
  const featureId = ROUTE_FEATURE_MAP[page];
  const subscription = getSubscription();
  
  if (featureId && !isFeatureUnlocked(featureId, subscription)) {
    const requiredTier = getRequiredTier(featureId);
    showToast(
      `This feature requires ${requiredTier} tier. Redirecting to pricing...`,
      'warning',
      3000
    );
    window.location.href = '/pricing';
    return false;
  }
  
  window.navigate(page, params);
  return true;
}

export function checkRouteAccess(page) {
  const featureId = ROUTE_FEATURE_MAP[page];
  const subscription = getSubscription();
  
  if (featureId) {
    return isFeatureUnlocked(featureId, subscription);
  }
  return true;
}

export { ROUTE_FEATURE_MAP };