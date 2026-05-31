import React, { useState } from "react";
import { useReactFlow } from "reactflow";

const NodeSendButton = ({ id, data, outputHistory, currentHistoryIndex, currentOutputIndex = 0 }) => {
  const [showMenu, setShowMenu] = useState(false);
  const connectedEdges = data.connectedEdges || [];
  if (connectedEdges.length === 0) return null;

  const handleSend = (targetId) => {
    const latest = outputHistory[currentHistoryIndex];
    const outputs = latest?.result?.outputs;
    if (outputs) {
      const specificOutput = outputs[currentOutputIndex]?.value || outputs[0]?.value;
      data.onDataChange(id, { outputs, resultUrl: specificOutput }, targetId);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        suppressHydrationWarning={true}
        onClick={(e) => {
          e.stopPropagation();
          if (connectedEdges.length === 1) {
            handleSend(connectedEdges[0].target);
          } else {
            setShowMenu(!showMenu);
          }
        }}
        className={`group/btn relative flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 bg-blue-600 hover:bg-blue-500 text-white shadow-lg`}
        title="Send to Connected Node"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
      </button>

      {showMenu && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1b1e] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 min-w-max">
          {(() => {
            const targetCounts = connectedEdges.reduce((acc, edge) => {
              acc[edge.target] = (acc[edge.target] || 0) + 1;
              return acc;
            }, {});

            return connectedEdges.map((edge) => (
              <button
                type="button"
                suppressHydrationWarning={true}
                key={edge.id}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors truncate capitalize cursor-pointer block"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSend(edge.target);
                  setShowMenu(false);
                }}
              >
                Send to {edge.target} {targetCounts[edge.target] > 1 ? `(${edge.targetHandle})` : ""}
              </button>
            ));
          })()}
        </div>
      )}

      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(false);
          }} 
        />
      )}
    </div>
  );
};

export default NodeSendButton;
