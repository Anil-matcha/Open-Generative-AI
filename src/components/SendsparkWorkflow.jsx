import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

const SendsparkWorkflow = ({
  workflows = [],
  currentWorkflow,
  onWorkflowSelect,
  onWorkflowCreate,
  onWorkflowRun,
  onWorkflowEdit,
  runningWorkflows = [],
  completedWorkflows = []
}) => {
  const [activeTab, setActiveTab] = useState('workflows');
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const defaultWorkflows = [
    {
      id: 'video-creation',
      name: 'Video Creation Pipeline',
      description: 'Generate, edit, and publish videos automatically',
      steps: [
        { id: 'generate', name: 'Generate Content', type: 'ai-generate', status: 'pending' },
        { id: 'edit', name: 'Edit & Polish', type: 'timeline-edit', status: 'pending' },
        { id: 'personalize', name: 'Add Personalization', type: 'personalization', status: 'pending' },
        { id: 'export', name: 'Export Final Video', type: 'export', status: 'pending' },
        { id: 'publish', name: 'Auto Publish', type: 'social-publish', status: 'pending' }
      ],
      triggers: ['manual', 'schedule'],
      integrations: ['social-media', 'email', 'analytics']
    },
    {
      id: 'batch-processing',
      name: 'Batch Video Processing',
      description: 'Process multiple videos with consistent branding',
      steps: [
        { id: 'upload', name: 'Batch Upload', type: 'batch-upload', status: 'pending' },
        { id: 'process', name: 'Apply Templates', type: 'template-apply', status: 'pending' },
        { id: 'quality', name: 'Quality Check', type: 'quality-gate', status: 'pending' },
        { id: 'distribute', name: 'Distribute', type: 'multi-publish', status: 'pending' }
      ],
      triggers: ['upload', 'api'],
      integrations: ['cloud-storage', 'cdn', 'analytics']
    },
    {
      id: 'personalization-hub',
      name: 'Personalization Hub',
      description: 'Create personalized content at scale',
      steps: [
        { id: 'data-import', name: 'Import Data', type: 'data-import', status: 'pending' },
        { id: 'segment', name: 'Audience Segmentation', type: 'segmentation', status: 'pending' },
        { id: 'generate', name: 'Generate Variants', type: 'batch-generate', status: 'pending' },
        { id: 'deliver', name: 'Deliver Content', type: 'automated-send', status: 'pending' }
      ],
      triggers: ['data-upload', 'api-webhook'],
      integrations: ['crm', 'email', 'analytics']
    }
  ];

  const allWorkflows = [...defaultWorkflows, ...workflows];

  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) return;

    const newWorkflow = {
      id: `custom-${Date.now()}`,
      name: newWorkflowName,
      description: 'Custom workflow',
      steps: [],
      triggers: ['manual'],
      integrations: [],
      isCustom: true
    };

    onWorkflowCreate(newWorkflow);
    setNewWorkflowName('');
    setIsCreating(false);
  };

  const renderWorkflowCard = (workflow) => (
    <div
      key={workflow.id}
      style={{
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onClick={() => onWorkflowSelect(workflow)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#3b82f6';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#374151';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', color: '#e5e7eb', fontSize: '16px' }}>
            {workflow.name}
          </h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
            {workflow.description}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {workflow.isCustom && (
            <span style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              CUSTOM
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWorkflowRun(workflow);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Run
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          Steps ({workflow.steps.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {workflow.steps.slice(0, 4).map((step) => (
            <span
              key={step.id}
              style={{
                backgroundColor: '#374151',
                color: '#9ca3af',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px'
              }}
            >
              {step.name}
            </span>
          ))}
          {workflow.steps.length > 4 && (
            <span style={{
              backgroundColor: '#374151',
              color: '#9ca3af',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px'
            }}>
              +{workflow.steps.length - 4} more
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
            Triggers
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {workflow.triggers.map((trigger) => (
              <span
                key={trigger}
                style={{
                  backgroundColor: '#111827',
                  color: '#6b7280',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: '10px'
                }}
              >
                {trigger}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
            Integrations
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {workflow.integrations.map((integration) => (
              <span
                key={integration}
                style={{
                  backgroundColor: '#111827',
                  color: '#6b7280',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: '10px'
                }}
              >
                {integration}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkflowDetail = () => {
    if (!currentWorkflow) return null;

    return (
      <div style={{ marginTop: '20px' }}>
        <div style={{
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, color: '#e5e7eb' }}>{currentWorkflow.name}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onWorkflowEdit(currentWorkflow)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
              <button
                onClick={() => onWorkflowRun(currentWorkflow)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Run Workflow
              </button>
            </div>
          </div>

          <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
            {currentWorkflow.description}
          </p>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#e5e7eb', marginBottom: '12px' }}>Workflow Steps</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentWorkflow.steps.map((step, index) => (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    marginRight: '12px'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#e5e7eb' }}>{step.name}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{step.type}</div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    backgroundColor:
                      step.status === 'completed' ? '#10b981' :
                      step.status === 'running' ? '#f59e0b' :
                      step.status === 'failed' ? '#ef4444' : '#6b7280',
                    color: 'white'
                  }}>
                    {step.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <h4 style={{ color: '#e5e7eb', marginBottom: '8px' }}>Triggers</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {currentWorkflow.triggers.map((trigger) => (
                  <span
                    key={trigger}
                    style={{
                      backgroundColor: '#374151',
                      color: '#9ca3af',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ color: '#e5e7eb', marginBottom: '8px' }}>Integrations</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {currentWorkflow.integrations.map((integration) => (
                  <span
                    key={integration}
                    style={{
                      backgroundColor: '#374151',
                      color: '#9ca3af',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  >
                    {integration}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRunningWorkflows = () => (
    <div>
      <h3 style={{ color: '#e5e7eb', marginBottom: '16px' }}>Running Workflows</h3>
      {runningWorkflows.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280'
        }}>
          No workflows currently running
        </div>
      ) : (
        runningWorkflows.map((workflow) => (
          <div
            key={workflow.id}
            style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ margin: 0, color: '#e5e7eb' }}>{workflow.name}</h4>
              <span style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px'
              }}>
                RUNNING
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#374151',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${workflow.progress || 0}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              {workflow.progress || 0}% complete
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="sendspark-workflow" style={{
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#e5e7eb' }}>Sendspark Workflow Automation</h2>
        <p style={{ margin: 0, color: '#9ca3af' }}>
          Automate your video creation, personalization, and distribution workflows
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #374151',
        marginBottom: '20px'
      }}>
        {[
          { id: 'workflows', label: 'Workflows', count: allWorkflows.length },
          { id: 'running', label: 'Running', count: runningWorkflows.length },
          { id: 'completed', label: 'Completed', count: completedWorkflows.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              backgroundColor: activeTab === tab.id ? '#1f2937' : 'transparent',
              color: activeTab === tab.id ? '#e5e7eb' : '#9ca3af',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              position: 'relative'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                marginLeft: '6px'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'workflows' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#e5e7eb' }}>Available Workflows</h3>
            <button
              onClick={() => setIsCreating(!isCreating)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {isCreating ? 'Cancel' : '+ Create Workflow'}
            </button>
          </div>

          {isCreating && (
            <div style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <input
                type="text"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="Enter workflow name..."
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  color: '#e5e7eb',
                  marginBottom: '8px'
                }}
              />
              <button
                onClick={handleCreateWorkflow}
                disabled={!newWorkflowName.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: newWorkflowName.trim() ? '#3b82f6' : '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: newWorkflowName.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Create Workflow
              </button>
            </div>
          )}

          {allWorkflows.map(renderWorkflowCard)}
          {renderWorkflowDetail()}
        </div>
      )}

      {activeTab === 'running' && renderRunningWorkflows()}

      {activeTab === 'completed' && (
        <div>
          <h3 style={{ color: '#e5e7eb', marginBottom: '16px' }}>Completed Workflows</h3>
          {completedWorkflows.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280'
            }}>
              No completed workflows yet
            </div>
          ) : (
            completedWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                style={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#e5e7eb' }}>{workflow.name}</h4>
                  <span style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px'
                  }}>
                    COMPLETED
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  Completed at {workflow.completedAt}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

SendsparkWorkflow.propTypes = {
  workflows: PropTypes.array,
  currentWorkflow: PropTypes.object,
  onWorkflowSelect: PropTypes.func,
  onWorkflowCreate: PropTypes.func,
  onWorkflowRun: PropTypes.func,
  onWorkflowEdit: PropTypes.func,
  runningWorkflows: PropTypes.array,
  completedWorkflows: PropTypes.array
};

export default observer(SendsparkWorkflow);