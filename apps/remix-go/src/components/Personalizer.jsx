import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { Search, User, Mail, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import { useVideoEditorStore } from '../stores/StoreProvider';

const Personalizer = observer(({ onTokenChosen }) => {
  const videoEditorStore = useVideoEditorStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock personalization tokens - in real implementation these would come from API
  const tokenCategories = [
    {
      id: 'contact',
      label: 'Contact Info',
      icon: User,
      tokens: [
        { key: '{{first_name}}', label: 'First Name', example: 'John' },
        { key: '{{last_name}}', label: 'Last Name', example: 'Doe' },
        { key: '{{full_name}}', label: 'Full Name', example: 'John Doe' },
        { key: '{{email}}', label: 'Email', example: 'john@example.com' },
        { key: '{{phone}}', label: 'Phone', example: '(555) 123-4567' },
        { key: '{{demo_user}}', label: 'Demo User', example: 'Demo User' },
      ]
    },
    {
      id: 'location',
      label: 'Location',
      icon: MapPin,
      tokens: [
        { key: '{{city}}', label: 'City', example: 'New York' },
        { key: '{{state}}', label: 'State', example: 'NY' },
        { key: '{{country}}', label: 'Country', example: 'USA' },
        { key: '{{zip_code}}', label: 'ZIP Code', example: '10001' },
      ]
    },
    {
      id: 'business',
      label: 'Business',
      icon: DollarSign,
      tokens: [
        { key: '{{company_name}}', label: 'Company Name', example: 'Acme Corp' },
        { key: '{{job_title}}', label: 'Job Title', example: 'Marketing Manager' },
        { key: '{{industry}}', label: 'Industry', example: 'Technology' },
      ]
    },
    {
      id: 'dates',
      label: 'Dates & Time',
      icon: Calendar,
      tokens: [
        { key: '{{current_date}}', label: 'Current Date', example: '2024-01-15' },
        { key: '{{current_month}}', label: 'Current Month', example: 'January' },
        { key: '{{current_year}}', label: 'Current Year', example: '2024' },
        { key: '{{signup_date}}', label: 'Signup Date', example: '2023-06-15' },
      ]
    }
  ];

  const allTokens = tokenCategories.flatMap(category => category.tokens);

  const filteredTokens = allTokens.filter(token => {
    const matchesSearch = token.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || token.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTokenSelect = (token) => {
    if (onTokenChosen) {
      onTokenChosen(token.key);
    }
  };

  return (
    <div className="personalizer">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Personalizer</h2>
        <p className="text-muted mb-6">Insert dynamic tokens to personalize your video content</p>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          {tokenCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-muted hover:bg-secondary/80'
                }`}
              >
                <Icon className="w-3 h-3" />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Tokens Grid */}
        <div className="space-y-4">
          {tokenCategories.map((category) => {
            if (selectedCategory !== 'all' && selectedCategory !== category.id) return null;

            const categoryTokens = category.tokens.filter(token =>
              token.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
              token.key.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (categoryTokens.length === 0) return null;

            const Icon = category.icon;

            return (
              <div key={category.id} className="glass-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{category.label}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryTokens.map((token) => (
                    <button
                      key={token.key}
                      onClick={() => handleTokenSelect(token)}
                      className="glass p-3 rounded-lg hover:shadow-glass-sm transition-all duration-200 text-left group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <code className="text-sm bg-secondary/50 px-2 py-1 rounded text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          {token.key}
                        </code>
                      </div>
                      <div className="text-sm font-medium text-foreground mb-1">
                        {token.label}
                      </div>
                      <div className="text-xs text-muted">
                        Example: {token.example}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {filteredTokens.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted opacity-50 mx-auto mb-4" />
            <p className="text-muted">No tokens found matching your search.</p>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 glass-card">
          <h3 className="text-lg font-semibold text-foreground mb-3">How to Use Tokens</h3>
          <div className="text-sm text-muted space-y-2">
            <p>
              <strong>Dynamic tokens</strong> allow you to personalize video content for each viewer.
              When someone watches your video, these tokens will be automatically replaced with their actual information.
            </p>
            <p>
              <strong>Example:</strong> "Welcome {{first_name}}!" becomes "Welcome John!" for viewers named John.
            </p>
            <p>
              <strong>Note:</strong> Tokens only work with text elements in your video. Make sure to select a text element first before using the personalizer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Personalizer;