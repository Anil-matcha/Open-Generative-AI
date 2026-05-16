const STORAGE_KEY = 'user_subscription';

const DEFAULT_SUBSCRIPTION = {
  userId: null,
  tier: 'free',
  status: 'active',
  purchases: {},
  expiresAt: null,
  licenseKey: null,
};

const APP_PRICES = {
  'director-editing': { price: 49, type: 'one-time' },
  'image-studio': { price: 29, type: 'one-time' },
  'video-studio': { price: 39, type: 'one-time' },
  'templates-pack': { price: 19, type: 'one-time' },
};

const PRODUCT_PRICES = {
  'ai-product': { price: 29, type: 'subscription', interval: 'month' },
};

function loadSubscription() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const sub = JSON.parse(saved);
      return { ...DEFAULT_SUBSCRIPTION, ...sub };
    }
  } catch (e) {
    console.error('Failed to load subscription:', e);
  }
  return { ...DEFAULT_SUBSCRIPTION };
}

function saveSubscription(subscription) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
  } catch (e) {
    console.error('Failed to save subscription:', e);
  }
}

let currentSubscription = loadSubscription();
let listeners = [];

export function getSubscription() {
  return currentSubscription;
}

export function setSubscription(subscription) {
  currentSubscription = subscription;
  saveSubscription(subscription);
  listeners.forEach(fn => fn(subscription));
}

export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function getTier() {
  return currentSubscription.tier || 'free';
}

export function getStatus() {
  return currentSubscription.status || 'active';
}

export function hasPurchased(productId) {
  const purchases = currentSubscription.purchases || {};
  const purchase = purchases[productId];
  if (!purchase) return false;
  
  if (purchase.type === 'subscription' && purchase.expiresAt) {
    return new Date(purchase.expiresAt) > new Date();
  }
  
  return purchase.status === 'active';
}

export function getPurchases() {
  return currentSubscription.purchases || {};
}

export function addPurchase(productId, purchaseInfo) {
  const subscription = { ...currentSubscription };
  subscription.purchases = subscription.purchases || {};
  subscription.purchases[productId] = {
    ...purchaseInfo,
    purchasedAt: new Date().toISOString(),
  };
  setSubscription(subscription);
}

export function initializeSubscription(tier = 'free') {
  const subscription = { ...DEFAULT_SUBSCRIPTION, tier, status: 'active' };
  setSubscription(subscription);
  return subscription;
}

export function isSubscriptionActive() {
  const sub = currentSubscription;
  if (!sub.expiresAt) return sub.status === 'active';
  return sub.status === 'active' && new Date(sub.expiresAt) > new Date();
}

export function getRemainingDays() {
  const sub = currentSubscription;
  if (!sub.expiresAt) return null;
  const ms = new Date(sub.expiresAt) - new Date();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function freeTrialEligible() {
  const sub = currentSubscription;
  return sub.tier === 'free';
}

export function startFreeTrial() {
  const subscription = { ...currentSubscription, tier: 'pro', trialStartedAt: new Date().toISOString() };
  setSubscription(subscription);
  return subscription;
}

export function resetSubscription() {
  currentSubscription = { ...DEFAULT_SUBSCRIPTION };
  saveSubscription(currentSubscription);
}

export { DEFAULT_SUBSCRIPTION, APP_PRICES, PRODUCT_PRICES };