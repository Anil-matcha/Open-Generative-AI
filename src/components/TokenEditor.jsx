import React, { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';

const TokenEditor = ({
  text = '',
  tokens = [],
  onTextChange,
  onTokensChange,
  availableTokens = [],
  placeholder = 'Enter your text with {tokens}...'
}) => {
  const [editorText, setEditorText] = useState(text);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(-1);
  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    setEditorText(text);
  }, [text]);

  const parseTokens = useCallback((inputText) => {
    const tokenRegex = /\{([^}]+)\}/g;
    const foundTokens = [];
    let match;

    while ((match = tokenRegex.exec(inputText)) !== null) {
      foundTokens.push({
        name: match[1],
        start: match.index,
        end: match.index + match[0].length,
        value: match[0]
      });
    }

    return foundTokens;
  }, []);

  const insertToken = (tokenName) => {
    const beforeCursor = editorText.slice(0, cursorPosition);
    const afterCursor = editorText.slice(cursorPosition);
    const tokenText = `{${tokenName}}`;
    const newText = beforeCursor + tokenText + afterCursor;

    setEditorText(newText);
    onTextChange(newText);

    // Update cursor position
    setCursorPosition(cursorPosition + tokenText.length);
    setIsTokenMenuOpen(false);
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setEditorText(newText);
    onTextChange(newText);

    // Parse and update tokens
    const parsedTokens = parseTokens(newText);
    onTokensChange(parsedTokens);
  };

  const handleKeyDown = (e) => {
    if (e.key === '{') {
      setIsTokenMenuOpen(true);
    } else if (e.key === 'Escape') {
      setIsTokenMenuOpen(false);
    } else if (e.key === 'Enter' && isTokenMenuOpen && selectedTokenIndex >= 0) {
      e.preventDefault();
      insertToken(availableTokens[selectedTokenIndex].name);
    } else if (e.key === 'ArrowDown' && isTokenMenuOpen) {
      e.preventDefault();
      setSelectedTokenIndex(prev =>
        prev < availableTokens.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp' && isTokenMenuOpen) {
      e.preventDefault();
      setSelectedTokenIndex(prev =>
        prev > 0 ? prev - 1 : availableTokens.length - 1
      );
    }
  };

  const handleSelectionChange = (e) => {
    setCursorPosition(e.target.selectionStart);
  };

  const renderTokenizedText = () => {
    const parts = [];
    let lastIndex = 0;

    tokens.forEach((token, index) => {
      // Add text before token
      if (token.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {editorText.slice(lastIndex, token.start)}
          </span>
        );
      }

      // Add token
      parts.push(
        <span
          key={`token-${index}`}
          className="token-editor-token"
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '2px 4px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          title={`Token: ${token.name}`}
        >
          {token.value}
        </span>
      );

      lastIndex = token.end;
    });

    // Add remaining text
    if (lastIndex < editorText.length) {
      parts.push(
        <span key="remaining">
          {editorText.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="token-editor" style={{ position: 'relative' }}>
      <div className="token-editor-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#ccc' }}>
          Token Editor
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {availableTokens.slice(0, 3).map((token, index) => (
            <button
              key={token.name}
              onClick={() => insertToken(token.name)}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                backgroundColor: '#374151',
                color: '#9ca3af',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title={token.description}
            >
              {token.name}
            </button>
          ))}
          {availableTokens.length > 3 && (
            <button
              onClick={() => setIsTokenMenuOpen(!isTokenMenuOpen)}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                backgroundColor: isTokenMenuOpen ? '#3b82f6' : '#374151',
                color: '#9ca3af',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              +
            </button>
          )}
        </div>
      </div>

      <div className="token-editor-preview" style={{
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        minHeight: '60px',
        color: '#e5e7eb'
      }}>
        {renderTokenizedText()}
      </div>

      <textarea
        value={editorText}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelectionChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: '100px',
          padding: '12px',
          backgroundColor: '#111827',
          border: '1px solid #374151',
          borderRadius: '8px',
          color: '#e5e7eb',
          fontFamily: 'monospace',
          fontSize: '14px',
          resize: 'vertical'
        }}
      />

      {isTokenMenuOpen && (
        <div className="token-menu" style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          marginTop: '4px'
        }}>
          {availableTokens.map((token, index) => (
            <div
              key={token.name}
              onClick={() => insertToken(token.name)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: index === selectedTokenIndex ? '#3b82f6' : 'transparent',
                borderBottom: index < availableTokens.length - 1 ? '1px solid #374151' : 'none'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#e5e7eb' }}>
                {token.name}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                {token.description}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="token-editor-footer" style={{
        marginTop: '8px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        Use {'{token_name}'} syntax to insert dynamic content. Available tokens: {availableTokens.length}
      </div>
    </div>
  );
};

TokenEditor.propTypes = {
  text: PropTypes.string,
  tokens: PropTypes.array,
  onTextChange: PropTypes.func.isRequired,
  onTokensChange: PropTypes.func,
  availableTokens: PropTypes.array,
  placeholder: PropTypes.string
};

export default observer(TokenEditor);