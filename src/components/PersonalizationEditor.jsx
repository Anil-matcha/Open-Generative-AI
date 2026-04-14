import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

const PersonalizationEditor = ({
  text = '',
  onTextChange,
  mergeFields = [],
  previewData = {},
  selectedElement,
  onElementUpdate,
  canvasElements = [],
  onCanvasElementAdd,
  onCanvasElementUpdate
}) => {
  const [editorMode, setEditorMode] = useState('text'); // 'text' or 'canvas'
  const [selectedTextRange, setSelectedTextRange] = useState(null);
  const textAreaRef = useRef(null);

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

  const insertToken = (token) => {
    if (editorMode === 'text') {
      const textarea = textAreaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const beforeText = text.slice(0, start);
      const afterText = text.slice(end);

      const newText = beforeText + token + afterText;
      onTextChange(newText);

      // Set cursor position after the inserted token
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    }
  };

  const handleTextSelection = () => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      setSelectedTextRange({ start, end, text: text.slice(start, end) });
    } else {
      setSelectedTextRange(null);
    }
  };

  const applyFormatting = (formatType) => {
    if (!selectedTextRange) return;

    const { start, end, text: selectedText } = selectedTextRange;
    let formattedText = selectedText;

    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'uppercase':
        formattedText = selectedText.toUpperCase();
        break;
      case 'lowercase':
        formattedText = selectedText.toLowerCase();
        break;
      default:
        break;
    }

    const newText = text.slice(0, start) + formattedText + text.slice(end);
    onTextChange(newText);

    // Update selection
    setTimeout(() => {
      const textarea = textAreaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start, start + formattedText.length);
      }
    }, 0);
  };

  const getPreviewText = () => {
    let preview = text;
    allMergeFields.forEach(field => {
      const token = field.token;
      const value = previewData[field.token.replace(/\{\{|\}\}/g, '')] || field.preview;
      preview = preview.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    return preview;
  };

  const renderTextEditor = () => (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button
            onClick={() => applyFormatting('bold')}
            disabled={!selectedTextRange}
            style={{
              padding: '4px 8px',
              backgroundColor: '#374151',
              color: selectedTextRange ? '#e5e7eb' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedTextRange ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            B
          </button>
          <button
            onClick={() => applyFormatting('italic')}
            disabled={!selectedTextRange}
            style={{
              padding: '4px 8px',
              backgroundColor: '#374151',
              color: selectedTextRange ? '#e5e7eb' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedTextRange ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              fontStyle: 'italic'
            }}
          >
            I
          </button>
          <button
            onClick={() => applyFormatting('uppercase')}
            disabled={!selectedTextRange}
            style={{
              padding: '4px 8px',
              backgroundColor: '#374151',
              color: selectedTextRange ? '#e5e7eb' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedTextRange ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            AA
          </button>
          <button
            onClick={() => applyFormatting('lowercase')}
            disabled={!selectedTextRange}
            style={{
              padding: '4px 8px',
              backgroundColor: '#374151',
              color: selectedTextRange ? '#e5e7eb' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedTextRange ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            aa
          </button>
        </div>
        {selectedTextRange && (
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            Selected: "{selectedTextRange.text}"
          </div>
        )}
      </div>

      <textarea
        ref={textAreaRef}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        onSelect={handleTextSelection}
        placeholder="Enter your personalized text here..."
        style={{
          width: '100%',
          minHeight: '120px',
          padding: '12px',
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          color: '#e5e7eb',
          fontFamily: 'monospace',
          fontSize: '14px',
          resize: 'vertical'
        }}
      />

      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
          Available Tokens:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {allMergeFields.map((field) => (
            <button
              key={field.token}
              onClick={() => insertToken(field.token)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#374151',
                color: '#9ca3af',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
              title={field.label}
            >
              {field.token}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div>
      <h4 style={{ margin: '0 0 12px 0', color: '#e5e7eb', fontSize: '14px' }}>Preview</h4>
      <div style={{
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '12px',
        minHeight: '100px',
        color: '#e5e7eb',
        whiteSpace: 'pre-wrap',
        fontFamily: 'Arial, sans-serif'
      }}>
        {getPreviewText()}
      </div>
    </div>
  );

  return (
    <div className="personalization-editor" style={{
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
          Personalization Editor
        </h2>
        <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
          Create and edit personalized content with dynamic tokens
        </p>
      </div>

      {/* Mode Toggle */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #374151',
        marginBottom: '16px'
      }}>
        {[
          { id: 'text', label: 'Text Editor', icon: '📝' },
          { id: 'canvas', label: 'Canvas Editor', icon: '🎨' }
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setEditorMode(mode.id)}
            style={{
              padding: '8px 12px',
              backgroundColor: editorMode === mode.id ? '#1f2937' : 'transparent',
              color: editorMode === mode.id ? '#e5e7eb' : '#9ca3af',
              border: 'none',
              borderBottom: editorMode === mode.id ? '2px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>

      {/* Editor Content */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
        {editorMode === 'text' && renderTextEditor()}
        {editorMode === 'canvas' && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Canvas editor coming soon...
          </div>
        )}
      </div>

      {/* Preview */}
      {renderPreview()}
    </div>
  );
};

PersonalizationEditor.propTypes = {
  text: PropTypes.string,
  onTextChange: PropTypes.func.isRequired,
  mergeFields: PropTypes.array,
  previewData: PropTypes.object,
  selectedElement: PropTypes.object,
  onElementUpdate: PropTypes.func,
  canvasElements: PropTypes.array,
  onCanvasElementAdd: PropTypes.func,
  onCanvasElementUpdate: PropTypes.func
};

export default observer(PersonalizationEditor);