import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

const Personalization = ({
  mergeFields = [],
  onMergeFieldAdd,
  onMergeFieldRemove,
  onMergeFieldUpdate,
  previewData = {},
  onPreviewDataChange,
  selectedClip,
  onApplyToClip
}) => {
  const [activeTab, setActiveTab] = useState('fields');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldToken, setNewFieldToken] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);

  const defaultMergeFields = [
    { token: '{{first_name}}', label: 'First Name', preview: 'John' },
    { token: '{{last_name}}', label: 'Last Name', preview: 'Smith' },
    { token: '{{email}}', label: 'Email', preview: 'john@example.com' },
    { token: '{{company}}', label: 'Company', preview: 'Acme Corp' },
    { token: '{{job_title}}', label: 'Job Title', preview: 'Manager' },
    { token: '{{phone}}', label: 'Phone', preview: '+1 555-1234' },
    { token: '{{city}}', label: 'City', preview: 'San Francisco' },
    { token: '{{country}}', label: 'Country', preview: 'United States' }
  ];

  const allMergeFields = [...defaultMergeFields, ...mergeFields];

  const handleAddField = () => {
    if (!newFieldName.trim() || !newFieldToken.trim()) return;

    const field = {
      token: `{{${newFieldToken.trim()}}}`,
      label: newFieldName.trim(),
      preview: 'Sample Value'
    };

    onMergeFieldAdd(field);
    setNewFieldName('');
    setNewFieldToken('');
    setIsAddingField(false);
  };

  const handleApplyToClip = () => {
    if (selectedClip && onApplyToClip) {
      onApplyToClip(selectedClip, allMergeFields);
    }
  };

  const renderFieldsTab = () => (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#e5e7eb', fontSize: '16px' }}>Merge Fields</h3>
        <button
          onClick={() => setIsAddingField(!isAddingField)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {isAddingField ? 'Cancel' : '+ Add Field'}
        </button>
      </div>

      {isAddingField && (
        <div style={{
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#9ca3af' }}>
              Field Name
            </label>
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="e.g., Department"
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#e5e7eb'
              }}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#9ca3af' }}>
              Token
            </label>
            <input
              type="text"
              value={newFieldToken}
              onChange={(e) => setNewFieldToken(e.target.value)}
              placeholder="e.g., department"
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#e5e7eb'
              }}
            />
          </div>
          <button
            onClick={handleAddField}
            disabled={!newFieldName.trim() || !newFieldToken.trim()}
            style={{
              padding: '6px 12px',
              backgroundColor: (newFieldName.trim() && newFieldToken.trim()) ? '#3b82f6' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (newFieldName.trim() && newFieldToken.trim()) ? 'pointer' : 'not-allowed'
            }}
          >
            Add Field
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gap: '8px' }}>
        {allMergeFields.map((field, index) => (
          <div
            key={field.token}
            style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold', color: '#e5e7eb', fontSize: '14px' }}>
                {field.label}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
                {field.token}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                Preview: {field.preview}
              </span>
              {index >= defaultMergeFields.length && (
                <button
                  onClick={() => onMergeFieldRemove(field)}
                  style={{
                    padding: '4px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreviewTab = () => (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: '#e5e7eb', fontSize: '16px' }}>Preview Data</h3>
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          Configure sample data to preview how personalization will look.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        {allMergeFields.map((field) => (
          <div
            key={field.token}
            style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '12px'
            }}
          >
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#9ca3af' }}>
              {field.label} ({field.token})
            </label>
            <input
              type="text"
              value={previewData[field.token.replace(/\{\{|\}\}/g, '')] || field.preview}
              onChange={(e) => onPreviewDataChange(field.token.replace(/\{\{|\}\}/g, ''), e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#e5e7eb'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="personalization-panel" style={{
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '12px',
      padding: '16px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#e5e7eb', fontSize: '18px' }}>
          Personalization
        </h2>
        <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
          Create personalized content using merge fields
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #374151',
        marginBottom: '16px'
      }}>
        {[
          { id: 'fields', label: 'Fields' },
          { id: 'preview', label: 'Preview' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 12px',
              backgroundColor: activeTab === tab.id ? '#1f2937' : 'transparent',
              color: activeTab === tab.id ? '#e5e7eb' : '#9ca3af',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'fields' && renderFieldsTab()}
        {activeTab === 'preview' && renderPreviewTab()}
      </div>

      {/* Apply Button */}
      {selectedClip && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
          <button
            onClick={handleApplyToClip}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Apply Personalization to "{selectedClip.name}"
          </button>
        </div>
      )}
    </div>
  );
};

Personalization.propTypes = {
  mergeFields: PropTypes.array,
  onMergeFieldAdd: PropTypes.func,
  onMergeFieldRemove: PropTypes.func,
  onMergeFieldUpdate: PropTypes.func,
  previewData: PropTypes.object,
  onPreviewDataChange: PropTypes.func,
  selectedClip: PropTypes.object,
  onApplyToClip: PropTypes.func
};

export default observer(Personalization);