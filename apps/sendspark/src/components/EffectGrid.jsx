import React, { useState } from 'react';
import { EFFECTS, EFFECT_CATEGORIES, getEffectsByCategory, getAllCategories, getCategoryName } from '../lib/effects.js';

function EffectGrid({ onSelect, selectedEffect }) {
  const [activeCategory, setActiveCategory] = useState(EFFECT_CATEGORIES.CAMERA_MOVES);

  const categories = getAllCategories();

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Select Effect</h3>

      {/* Category Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {getEffectsByCategory(activeCategory).map(effect => (
          <button
            key={effect.id}
            onClick={() => onSelect(effect)}
            className={`p-3 rounded-lg text-left transition-all ${
              selectedEffect?.id === effect.id
                ? 'bg-blue-600 border-2 border-blue-400'
                : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
            }`}
          >
            <h4 className="font-medium text-sm mb-1">{effect.name}</h4>
            <p className="text-xs text-gray-400">{effect.description}</p>
          </button>
        ))}
      </div>

      {selectedEffect && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
          <h4 className="font-medium text-sm mb-1">Selected: {selectedEffect.name}</h4>
          <p className="text-xs text-gray-400">{selectedEffect.description}</p>
        </div>
      )}
    </div>
  );
}

export default EffectGrid;