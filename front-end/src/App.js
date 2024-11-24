import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './flowEditor.css';

const nodeTypes = {
  coldEmail: ColdEmailNode,
  delay: DelayNode,
  leadSource: LeadSourceNode
};

const initialNodes = [
  {
    id: '1',
    type: 'leadSource',
    position: { x: 250, y: 50 },
    data: { label: 'Lead Source' },
  },
];

const EmailFlowEditor = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = (_, node) => {
    setSelectedNode(node);
  };

  const addNewNode = (type) => {
    const newNode = {
      id: String(Date.now()),
      type,
      position: { x: 250, y: nodes.length * 100 + 50 },
      data: { 
        label: type === 'coldEmail' ? 'Cold Email' : 
               type === 'delay' ? 'Wait/Delay' : 'Lead Source'
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const saveFlow = async () => {
    try {
      const flowData = {
        nodes,
        edges,
      };
      
      const response = await fetch('/api/save-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flowData),
      });
      
      if (!response.ok) throw new Error('Failed to save flow');
      alert('Flow saved successfully!');
    } catch (error) {
      console.error('Error saving flow:', error);
      alert('Failed to save flow');
    }
  };

  return (
    <div className="flow-editor-container">
      <div className="toolbar">
        <div className="button-group">
          <button
            onClick={() => addNewNode('coldEmail')}
            className="button button-email"
          >
            Add Cold Email
          </button>
          <button
            onClick={() => addNewNode('delay')}
            className="button button-delay"
          >
            Add Delay
          </button>
          <button
            onClick={saveFlow}
            className="button button-save"
          >
            Save Flow
          </button>
        </div>
      </div>
      
      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      
      {selectedNode && <NodeSettingsPanel node={selectedNode} setNodes={setNodes} />}
    </div>
  );
};

export default EmailFlowEditor;