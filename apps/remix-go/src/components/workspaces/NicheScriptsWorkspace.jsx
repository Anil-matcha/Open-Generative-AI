import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Search, Play, Clock, Users, Target } from 'lucide-react';
import { useProjectStore } from '../../stores/StoreProvider';

const NicheScriptsWorkspace = observer(({ onScriptSelected }) => {
  const projectStore = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock niche scripts data - in real implementation this would come from API
  const [scripts] = useState([
    {
      id: '1',
      title: 'Product Launch Script',
      description: 'Perfect for announcing new products or features',
      category: 'product',
      duration: '2:30',
      niche: 'Technology',
      targetAudience: 'Tech-savvy consumers',
      previewText: 'Are you tired of [problem]? Introducing [product] - the solution you\'ve been waiting for...'
    },
    {
      id: '2',
      title: 'Customer Success Story',
      description: 'Showcase customer testimonials and results',
      category: 'testimonial',
      duration: '1:45',
      niche: 'B2B Services',
      targetAudience: 'Business decision makers',
      previewText: 'Meet [customer name], who increased their [metric] by [percentage] using our [service]...'
    },
    {
      id: '3',
      title: 'Educational Tutorial',
      description: 'Teach concepts with clear, engaging explanations',
      category: 'education',
      duration: '3:15',
      niche: 'Online Learning',
      targetAudience: 'Students and professionals',
      previewText: 'Today we\'re diving deep into [topic]. Whether you\'re new to this or looking to advance your skills...'
    },
    {
      id: '4',
      title: 'Brand Awareness',
      description: 'Build brand recognition and recall',
      category: 'marketing',
      duration: '1:30',
      niche: 'Consumer Goods',
      targetAudience: 'General consumers',
      previewText: 'When you think of [industry], think [brand]. Here\'s why millions choose us...'
    },
    {
      id: '5',
      title: 'Lead Generation',
      description: 'Capture leads with compelling offers',
      category: 'sales',
      duration: '2:00',
      niche: 'SaaS',
      targetAudience: 'Small business owners',
      previewText: 'Ready to transform your [problem]? Download our free guide and discover how to [benefit]...'
    },
    {
      id: '6',
      title: 'Event Promotion',
      description: 'Drive attendance to webinars and events',
      category: 'events',
      duration: '1:15',
      niche: 'Professional Development',
      targetAudience: 'Industry professionals',
      previewText: 'Join us for an exclusive [event type] where you\'ll learn [key benefit] from industry experts...'
    }
  ]);

  const categories = [
    { id: 'all', label: 'All Scripts' },
    { id: 'product', label: 'Product Launch' },
    { id: 'testimonial', label: 'Testimonials' },
    { id: 'education', label: 'Educational' },
    { id: 'marketing', label: 'Brand Marketing' },
    { id: 'sales', label: 'Lead Generation' },
    { id: 'events', label: 'Events' }
  ];

  const niches = [
    'Technology', 'B2B Services', 'Online Learning', 'Consumer Goods',
    'SaaS', 'Professional Development', 'Health & Wellness', 'Finance'
  ];

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.niche.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || script.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleScriptSelect = async (script) => {
    setIsLoading(true);
    try {
      // In real implementation, this would create a project with the script
      // For now, simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      onScriptSelected && onScriptSelected({
        ...script,
        type: 'niche-script',
        selectedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to select script:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="niche-scripts-workspace">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose a Niche Script</h2>
        <p className="text-muted mb-6">Select a pre-written script tailored to your industry and goals</p>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field w-48"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Scripts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScripts.map((script) => (
            <div
              key={script.id}
              className="glass-card hover:shadow-glass-sm transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {script.title}
                  </h3>
                  <p className="text-muted text-sm mb-2">
                    {script.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Clock className="w-3 h-3" />
                  {script.duration}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted">Niche:</span>
                  <span className="text-sm font-medium text-foreground">{script.niche}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted">Audience:</span>
                  <span className="text-sm font-medium text-foreground">{script.targetAudience}</span>
                </div>
              </div>

              <div className="bg-secondary/20 p-3 rounded-lg mb-4">
                <p className="text-sm text-muted italic">
                  "{script.previewText}"
                </p>
              </div>

              <button
                onClick={() => handleScriptSelect(script)}
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Selecting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Use This Script
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {filteredScripts.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted opacity-50 mx-auto mb-4" />
            <p className="text-muted">No scripts found matching your search.</p>
            <p className="text-sm text-muted mt-2">
              Try adjusting your search terms or category filter.
            </p>
          </div>
        )}

        {/* Popular Niches */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Popular Niches</h3>
          <div className="flex flex-wrap gap-2">
            {niches.slice(0, 8).map((niche) => (
              <button
                key={niche}
                onClick={() => setSearchTerm(niche)}
                className="px-3 py-1 bg-secondary text-muted rounded-full text-sm hover:bg-secondary/80 transition-colors"
              >
                {niche}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default NicheScriptsWorkspace;