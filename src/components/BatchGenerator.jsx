import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

const BatchGenerator = ({
  onBatchGenerate,
  templates = [],
  selectedTemplate,
  onTemplateSelect,
  batchSettings = {},
  onSettingsChange,
  isGenerating = false,
  progress = 0,
  queue = []
}) => {
  const [batchItems, setBatchItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewItem, setPreviewItem] = useState(null);

  const steps = [
    { id: 'setup', label: 'Setup Batch', icon: '⚙️' },
    { id: 'data', label: 'Input Data', icon: '📊' },
    { id: 'preview', label: 'Preview', icon: '👁️' },
    { id: 'generate', label: 'Generate', icon: '⚡' }
  ];

  const handleAddBatchItem = () => {
    const newItem = {
      id: Date.now(),
      name: `Item ${batchItems.length + 1}`,
      data: {},
      status: 'pending'
    };
    setBatchItems([...batchItems, newItem]);
  };

  const handleRemoveBatchItem = (id) => {
    setBatchItems(batchItems.filter(item => item.id !== id));
  };

  const handleBatchItemChange = (id, field, value) => {
    setBatchItems(batchItems.map(item =>
      item.id === id ? { ...item, data: { ...item.data, [field]: value } } : item
    ));
  };

  const handlePreviewItem = (item) => {
    setPreviewItem(item);
    setCurrentStep(2);
  };

  const handleStartGeneration = () => {
    if (batchItems.length === 0) return;

    const batchData = {
      template: selectedTemplate,
      items: batchItems,
      settings: batchSettings
    };

    onBatchGenerate(batchData);
    setCurrentStep(3);
  };

  const renderSetupStep = () => (
    <div className="batch-generator-setup">
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Select Template
        </label>
        <select
          value={selectedTemplate?.id || ''}
          onChange={(e) => onTemplateSelect(templates.find(t => t.id === e.target.value))}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '4px',
            color: '#e5e7eb'
          }}
        >
          <option value="">Choose a template...</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Batch Settings
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Output Format
            </label>
            <select
              value={batchSettings.format || 'mp4'}
              onChange={(e) => onSettingsChange({ ...batchSettings, format: e.target.value })}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#e5e7eb'
              }}
            >
              <option value="mp4">MP4</option>
              <option value="webm">WebM</option>
              <option value="gif">GIF</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Quality
            </label>
            <select
              value={batchSettings.quality || 'high'}
              onChange={(e) => onSettingsChange({ ...batchSettings, quality: e.target.value })}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#e5e7eb'
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={() => setCurrentStep(1)}
        disabled={!selectedTemplate}
        style={{
          padding: '10px 16px',
          backgroundColor: selectedTemplate ? '#3b82f6' : '#374151',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: selectedTemplate ? 'pointer' : 'not-allowed'
        }}
      >
        Next: Add Data
      </button>
    </div>
  );

  const renderDataStep = () => (
    <div className="batch-generator-data">
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Batch Items ({batchItems.length})</h3>
        <button
          onClick={handleAddBatchItem}
          style={{
            padding: '8px 12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Add Item
        </button>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {batchItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>{item.name}</span>
              <div>
                <button
                  onClick={() => handlePreviewItem(item)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '4px'
                  }}
                >
                  👁️ Preview
                </button>
                <button
                  onClick={() => handleRemoveBatchItem(item.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {selectedTemplate?.fields?.map(field => (
              <div key={field.id} style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                  {field.label}
                </label>
                {field.type === 'text' ? (
                  <input
                    type="text"
                    value={item.data[field.id] || ''}
                    onChange={(e) => handleBatchItemChange(item.id, field.id, e.target.value)}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '4px',
                      color: '#e5e7eb'
                    }}
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={item.data[field.id] || ''}
                    onChange={(e) => handleBatchItemChange(item.id, field.id, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '4px',
                      color: '#e5e7eb',
                      resize: 'vertical'
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setCurrentStep(0)}
          style={{
            padding: '10px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(2)}
          disabled={batchItems.length === 0}
          style={{
            padding: '10px 16px',
            backgroundColor: batchItems.length > 0 ? '#3b82f6' : '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: batchItems.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          Next: Preview
        </button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="batch-generator-preview">
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Preview Generation</h3>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          Review how your batch items will look before generating.
        </p>
      </div>

      {previewItem && (
        <div style={{
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Preview: {previewItem.name}</h4>
          <div style={{ backgroundColor: '#111827', padding: '12px', borderRadius: '4px' }}>
            {selectedTemplate?.fields?.map(field => (
              <div key={field.id} style={{ marginBottom: '8px' }}>
                <strong>{field.label}:</strong> {previewItem.data[field.id] || 'Not set'}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Batch Summary</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
          <div style={{ backgroundColor: '#1f2937', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{batchItems.length}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Items</div>
          </div>
          <div style={{ backgroundColor: '#1f2937', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedTemplate?.name}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Template</div>
          </div>
          <div style={{ backgroundColor: '#1f2937', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{batchSettings.format?.toUpperCase()}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Format</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setCurrentStep(1)}
          style={{
            padding: '10px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          onClick={handleStartGeneration}
          style={{
            padding: '10px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Start Batch Generation
        </button>
      </div>
    </div>
  );

  const renderGenerateStep = () => (
    <div className="batch-generator-generate">
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Generating Batch</h3>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#374151',
          borderRadius: '4px',
          margin: '8px 0',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          {progress}% complete - {queue.length} items remaining
        </p>
      </div>

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {queue.map((item, index) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              marginBottom: '4px'
            }}
          >
            <span>{item.name}</span>
            <span style={{
              color: item.status === 'completed' ? '#10b981' :
                     item.status === 'processing' ? '#f59e0b' : '#6b7280'
            }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>

      {progress === 100 && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            onClick={() => setCurrentStep(0)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Create New Batch
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="batch-generator" style={{
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Progress Steps */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '24px',
        position: 'relative'
      }}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              position: 'relative'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: index <= currentStep ? '#3b82f6' : '#374151',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
              fontSize: '18px'
            }}>
              {step.icon}
            </div>
            <div style={{
              fontSize: '12px',
              color: index <= currentStep ? '#3b82f6' : '#6b7280',
              textAlign: 'center'
            }}>
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                width: 'calc(100% - 40px)',
                height: '2px',
                backgroundColor: index < currentStep ? '#3b82f6' : '#374151',
                zIndex: -1
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ minHeight: '400px' }}>
        {currentStep === 0 && renderSetupStep()}
        {currentStep === 1 && renderDataStep()}
        {currentStep === 2 && renderPreviewStep()}
        {currentStep === 3 && renderGenerateStep()}
      </div>
    </div>
  );
};

BatchGenerator.propTypes = {
  onBatchGenerate: PropTypes.func.isRequired,
  templates: PropTypes.array,
  selectedTemplate: PropTypes.object,
  onTemplateSelect: PropTypes.func,
  batchSettings: PropTypes.object,
  onSettingsChange: PropTypes.func,
  isGenerating: PropTypes.bool,
  progress: PropTypes.number,
  queue: PropTypes.array
};

export default observer(BatchGenerator);