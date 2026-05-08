import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react';
import { FileText, Play, Upload, FolderOpen, Loader2 } from 'lucide-react';
import { useProjectStore, useUserStore } from '../stores/StoreProvider';
import VideoSelectionWorkspace from '../components/workspaces/VideoSelectionWorkspace';
import NicheScriptsWorkspace from '../components/workspaces/NicheScriptsWorkspace';

const GettingStarted = observer(() => {
  const navigate = useNavigate();
  const projectStore = useProjectStore();
  const userStore = useUserStore();
  const [selectedWizard, setSelectedWizard] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const wizardTypes = {
    template: { key: 'template', label: 'Choose Template' },
    generator: { key: 'generator', label: 'Choose a Video' },
    upload: { key: 'upload', label: 'Upload Your Video' },
  };

  useEffect(() => {
    // Load templates when component mounts
    if (projectStore.templates.length === 0) {
      projectStore.loadTemplates();
    }
  }, [projectStore]);

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

  const handleWizardSelection = async (wizardType) => {
    if (wizardType === 'template') {
      setSelectedWizard(wizardType);
      return;
    }

    if (wizardType === 'generator') {
      setSelectedWizard(wizardType);
      return;
    }

    try {
      // For upload wizard, create a basic project
      const projectData = {
        title: `New Project - ${wizardTypes[wizardType].label}`,
        wizardType,
        createdAt: new Date().toISOString(),
      };

      const project = await projectStore.createProject(projectData);
      navigate('/editor');
    } catch (error) {
      console.error('Failed to create project:', error);
      // For now, just navigate to editor
      navigate('/editor');
    }
  };

  const handleVideoSelected = async (videoData) => {
    try {
      const projectData = {
        title: `New Project from Video`,
        wizardType: 'upload',
        video: videoData,
        createdAt: new Date().toISOString(),
      };

      const project = await projectStore.createProject(projectData);
      setSelectedWizard(null);
      navigate('/editor');
    } catch (error) {
      console.error('Failed to create project:', error);
      navigate('/editor');
    }
  };

  const handleScriptSelected = async (scriptData) => {
    try {
      // For template generator, combine video selection with script
      if (selectedWizard === 'generator') {
        // In real implementation, this would be handled differently
        // For now, just create project with script
        const projectData = {
          title: `New Project - ${scriptData.title}`,
          wizardType: 'generator',
          script: scriptData,
          createdAt: new Date().toISOString(),
        };

        const project = await projectStore.createProject(projectData);
        setSelectedWizard(null);
        navigate('/editor');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      navigate('/editor');
    }
  };

  const handleTemplateSelect = async (template) => {
    try {
      await projectStore.createFromTemplate(template._id);
      navigate('/editor');
    } catch (error) {
      console.error('Failed to create project from template:', error);
      navigate('/editor');
    }
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

        {/* Workspace Modals */}
        {selectedWizard && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-border">
                <h2 className="text-2xl font-bold text-foreground">
                  {selectedWizard === 'template' && 'Choose a Template'}
                  {selectedWizard === 'generator' && 'Template Generator'}
                </h2>
                <button
                  onClick={() => setSelectedWizard(null)}
                  className="p-2 hover:bg-secondary/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
                {selectedWizard === 'template' && (
                  <div className="p-6">
                    {projectStore.isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="ml-3 text-muted">Loading templates...</span>
                      </div>
                    ) : projectStore.templates.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projectStore.templates.slice(0, 6).map((template) => (
                          <button
                            key={template._id}
                            onClick={() => handleTemplateSelect(template)}
                            className="glass p-4 rounded-lg hover:shadow-glass-sm transition-all duration-200 text-left group"
                          >
                            <div className="aspect-video bg-secondary/20 rounded mb-3 flex items-center justify-center">
                              {template.thumbnail ? (
                                <img
                                  src={template.thumbnail}
                                  alt={template.title}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <FileText className="w-12 h-12 text-muted opacity-50" />
                              )}
                            </div>
                            <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                              {template.title}
                            </h3>
                            <p className="text-muted text-sm">
                              {template.description || 'Professional video template'}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-muted opacity-50 mx-auto mb-4" />
                        <p className="text-muted">No templates available</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedWizard === 'generator' && (
                  <div className="flex h-[600px]">
                    <div className="w-1/2 border-r border-border">
                      <VideoSelectionWorkspace onVideoSelected={handleVideoSelected} />
                    </div>
                    <div className="w-1/2">
                      <NicheScriptsWorkspace onScriptSelected={handleScriptSelected} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default GettingStarted;