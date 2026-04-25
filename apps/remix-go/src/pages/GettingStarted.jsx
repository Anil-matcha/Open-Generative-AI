import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Upload, FileText, FolderOpen } from 'lucide-react';

const GettingStarted = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const options = [
    {
      id: 'template',
      title: 'Start From Template',
      description: 'Choose from pre-built video templates',
      icon: <FileText className="w-8 h-8" />,
      action: () => navigate('/editor'),
    },
    {
      id: 'generator',
      title: 'Template Generator',
      description: 'Create custom templates with AI',
      icon: <Play className="w-8 h-8" />,
      action: () => setShowTemplateModal(true),
    },
    {
      id: 'upload',
      title: 'Upload Video',
      description: 'Import your own video files',
      icon: <Upload className="w-8 h-8" />,
      action: () => navigate('/editor'),
    },
    {
      id: 'projects',
      title: 'My Projects',
      description: 'Continue working on existing projects',
      icon: <FolderOpen className="w-8 h-8" />,
      action: () => navigate('/editor'),
    },
  ];

  const templates = [
    { id: 'business', name: 'Business Presentation', niche: 'Corporate' },
    { id: 'social', name: 'Social Media Story', niche: 'Marketing' },
    { id: 'tutorial', name: 'Tutorial Video', niche: 'Education' },
    { id: 'promo', name: 'Product Promotion', niche: 'E-commerce' },
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowTemplateModal(false);
    navigate('/editor');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to VideoRemix Go
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Create personalized videos with our lite video editor. Start from templates,
            upload your own content, or continue with existing projects.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              className="glass-card hover:shadow-glass transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                  {option.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {option.title}
                  </h3>
                  <p className="text-muted text-sm">
                    {option.description}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="w-6 h-6 rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Template Generator Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-foreground mb-6">Choose a Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="glass p-4 rounded-lg hover:shadow-glass-sm transition-all duration-200 text-left"
                >
                  <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
                  <p className="text-muted text-sm">{template.niche}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GettingStarted;