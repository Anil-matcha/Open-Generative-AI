import React, { useState } from 'react';
import { getAppFeatures, getAIFeatures, APP_PRICES, PRODUCT_PRICES } from '../lib/featureFlags';
import { addPurchase, getSubscription } from '../lib/subscriptionService';

const PricingPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async (productId, price) => {
    setIsPurchasing(true);
    try {
      addPurchase(productId, { status: 'active', type: 'one-time' });
      
      window.location.href = '/';
    } catch (error) {
      console.error('Purchase failed:', error);
      
    } finally {
      setIsPurchasing(false);
    }
  );

  const appFeatures = getAppFeatures();
  const aiFeatures = getAIFeatures();
  const subscription = getSubscription();

  return (
    <div className="w-full min-h-screen bg-app-bg pt-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4">Unlock Premium Features</h1>
          <p className="text-secondary max-w-2xl mx-auto">
            Get instant access to powerful AI tools and editing capabilities. All purchases include our satisfaction guarantee.
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-primary">🎬</span> Standalone Apps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appFeatures.map(feature => {
                const isPurchased = subscription.purchases?.[feature.id];
                return (
                  <div key={feature.id} className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-white">{feature.name}</h3>
                      {isPurchased && <span className="text-green-400 text-xs">✓ Purchased</span>}
                    </div>
                    <p className="text-secondary text-sm mb-4">{feature.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-white">${feature.price}</span>
                      <button
                        onClick={() => handlePurchase(feature.id, feature.price)}
                        disabled={isPurchased || isPurchasing}
                        className="px-5 py-2 bg-primary text-black font-bold rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPurchased ? 'Owned' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-primary">✨</span> AI Product
            </h2>
            <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl p-6 border border-primary/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-xl">AI Features Bundle</h3>
                {subscription.purchases?.['ai-product'] && <span className="text-green-400 text-xs">✓ Purchased</span>}
              </div>
              <p className="text-secondary mb-4">
                Unlimited access to all AI tools: video generation, image editing, background removal, colorization, enhancement, text-to-speech, and more.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 text-xs">
                {aiFeatures.slice(0, 8).map(f => (
                  <div key={f.id} className="bg-white/5 rounded-lg p-2 text-center">
                    <span className="text-primary">{f.icon || '🤖'}</span>
                    <div className="text-secondary truncate mt-1">{f.name}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-white">$29</span>
                  <span className="text-secondary text-sm ml-2">/month</span>
                </div>
                <button
                  onClick={() => handlePurchase('ai-product', 29)}
                  disabled={subscription.purchases?.['ai-product'] || isPurchasing}
                  className="px-5 py-2 bg-primary text-black font-bold rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subscription.purchases?.['ai-product'] ? 'Owned' : 'Subscribe'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <h3 className="font-bold text-white mb-3">Payment Information</h3>
            <p className="text-secondary text-sm mb-4">
              In production, this page would integrate with Stripe for secure payment processing. 
              For testing, purchases are simulated and stored in localStorage.
            </p>
            <div className="text-xs text-secondary space-y-1">
              <div>• All purchases are one-time unless specified</div>
              <div>• 30-day money-back guarantee</div>
              <div>• Instant access after purchase</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;