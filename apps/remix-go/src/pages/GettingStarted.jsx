import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Play, Upload, FolderOpen } from 'lucide-react';

const GettingStarted = () => {
  const navigate = useNavigate();
  const [selectedWizard, setSelectedWizard] = useState(null);

  const wizardTypes = {
    template: { key: 'template', label: 'Choose Template' },
    generator: { key: 'generator', label: 'Choose a Video' },
    upload: { key: 'upload', label: 'Upload Your Video' },
  };

  const options = [
    {
      id: 'template',
      title: 'Start From Template',
      description: 'Choose from pre-built video templates',
      icon: <FileText className="w-8 h-8" />,
      action: () => handleWizardSelection('template'),
      wizardType: wizardTypes.template,
    },
    {
      id: 'generator',
      title: 'Template Generator',
      description: 'Create custom templates with AI',
      icon: <Play className="w-8 h-8" />,
      action: () => handleWizardSelection('generator'),
      wizardType: wizardTypes.generator,
    },
    {
      id: 'upload',
      title: 'Import Your Own Video',
      description: 'Upload and edit your video files',
      icon: <Upload className="w-8 h-8" />,
      action: () => handleWizardSelection('upload'),
      wizardType: wizardTypes.upload,
    },
    {
      id: 'projects',
      title: 'My Projects',
      description: 'Continue working on existing projects',
      icon: <FolderOpen className="w-8 h-8" />,
      action: () => navigate('/editor'),
      external: true,
    },
  ];

  const handleWizardSelection = (wizardType) => {
    setSelectedWizard(wizardType);
    // In a real implementation, this would create a project
    // For now, just navigate to editor
    navigate('/editor');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to VideoRemix Go!
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

        {/* Phase Navigation for active wizard */}
        {selectedWizard && (
          <div className="mt-12 glass-card max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-8 p-6">
              <div className="flex items-center gap-4">
                <div className="phase-indicator active">
                  <span className="text-sm font-medium">
                    {wizardTypes[selectedWizard]?.label || 'Getting Started'}
                  </span>
                </div>
                <div className="w-8 h-0.5 bg-muted"></div>
                <div className="phase-indicator">
                  <span className="text-sm">Customize Video</span>
                </div>
                <div className="w-8 h-0.5 bg-muted"></div>
                <div className="phase-indicator">
                  <span className="text-sm">Publish & Share</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GettingStarted;