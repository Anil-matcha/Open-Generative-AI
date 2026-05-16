import React, { useState, useEffect } from 'react';
import { getFeature, canUseFeature, getFeaturePrice } from '../lib/featureFlags';
import { getSubscription, getTier, subscribe } from '../lib/subscriptionService';

const FeatureGate = ({ 
  feature, 
  children, 
  fallback = null,
  onPurchase = null
}) => {
  const [subscription, setSubscription] = useState(getSubscription());
  const [showPurchase, setShowPurchase] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe(listener => {
      setSubscription(listener);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!canUseFeature(feature, subscription) && featureData) {
      setShowPurchase(true);
    }
  }, [subscription]);

  const featureData = getFeature(feature);
  const isUnlocked = canUseFeature(feature, subscription);
  const tier = getTier();
  const price = getFeaturePrice(feature);

  if (isUnlocked) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(feature, price);
    } else {
      setShowPurchase(true);
    }
  };

  const purchaseContent = (
    <div className="feature-gate-locked">
      <div className="feature-gate-content">
        <div className="feature-icon">
          {featureData?.icon || '🔒'}
        </div>
        <h3>{featureData?.name || 'Feature Locked'}</h3>
        <p>
          {featureData?.description || 
           `This feature requires purchase. Unlock to access.`}
        </p>
        {price > 0 && (
          <div className="price-info">
            <p>Price: ${price}</p>
          </div>
        )}
        <button 
          className="purchase-btn"
          onClick={handlePurchase}
        >
          Purchase to Unlock
        </button>
      </div>
    </div>
  );

  return purchaseContent;
};

export default FeatureGate;