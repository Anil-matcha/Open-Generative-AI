import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Search, Play, Clock, Star, Filter } from 'lucide-react';
import { useProjectStore } from '../stores/StoreProvider';

const Templates = observer(({ onTemplateSelected }) => {
  const projectStore = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    // Load templates when component mounts
    if (projectStore.templates.length === 0) {
      projectStore.loadTemplates();
    }
  }, [projectStore]);

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'business', label: 'Business' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'education', label: 'Education' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'social', label: 'Social Media' },
    { id: 'product', label: 'Product' }
  ];

  const sortOptions = [
    { id: 'popular', label: 'Most Popular' },
    { id: 'recent', label: 'Recently Added' },
    { id: 'rating', label: 'Highest Rated' },
    { id: 'name', label: 'Name A-Z' }
  ];

  // Filter and sort templates
  const filteredTemplates = projectStore.templates.filter(template => {
    const matchesSearch = template.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title?.localeCompare(b.title);
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'popular':
      default:
        return (b.usageCount || 0) - (a.usageCount || 0);
    }
  });

  const handleTemplateSelect = (template) => {
    onTemplateSelected && onTemplateSelected(template);
  };

  return (
    <div className="templates">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Template Gallery</h2>
            <p className="text-muted">Choose from professionally designed video templates</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted">
              {filteredTemplates.length} templates
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field w-48"
          >
            {sortOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {projectStore.isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-3 text-muted">Loading templates...</span>
          </div>
        )}

        {/* Templates Grid */}
        {!projectStore.isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template._id || template.id}
                onClick={() => handleTemplateSelect(template)}
                className="glass-card cursor-pointer hover:shadow-glass-sm transition-all duration-200 group"
              >
                <div className="aspect-video mb-4 overflow-hidden rounded-lg relative">
                  <img
                    src={template.thumbnail || 'https://via.placeholder.com/300x200/6b7280/ffffff?text=Template'}
                    alt={template.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>

                  {/* Template overlay info */}
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {template.duration || '2:30'}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {template.title}
                  </h3>

                  <p className="text-sm text-muted line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-yellow-500" />
                      <span>{template.rating || 4.5}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      <span>{template.category || 'General'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted">
                      {template.usageCount || Math.floor(Math.random() * 1000) + 100} uses
                    </div>
                    <button className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors">
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!projectStore.isLoading && filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 text-muted opacity-50 mx-auto mb-4" />
            <p className="text-muted">No templates found matching your criteria.</p>
            <p className="text-sm text-muted mt-2">
              Try adjusting your search or filter settings.
            </p>
          </div>
        )}

        {/* Template Categories Overview */}
        {!projectStore.isLoading && selectedCategory === 'all' && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(1).map((category) => {
                const categoryTemplates = projectStore.templates.filter(t => t.category === category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="glass-card p-4 hover:shadow-glass-sm transition-all duration-200 text-center group"
                  >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                      📹
                    </div>
                    <h4 className="font-medium text-foreground mb-1">{category.label}</h4>
                    <p className="text-xs text-muted">{categoryTemplates.length} templates</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default Templates;