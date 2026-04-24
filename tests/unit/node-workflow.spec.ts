import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowNode, NodeType } from '../../src/lib/workflow/WorkflowNode';
import { WorkflowConnection } from '../../src/lib/workflow/WorkflowConnection';
import { WorkflowEngine } from '../../src/lib/workflow/WorkflowEngine';
import { ModelRegistry } from '../../src/lib/workflow/ModelRegistry';

describe('Node-based Workflow System', () => {
  describe('WorkflowNode', () => {
    it('should create a node with correct properties', () => {
      const node = new WorkflowNode('test-node', NodeType.INPUT, { x: 100, y: 200 });

      expect(node.id).toBe('test-node');
      expect(node.type).toBe(NodeType.INPUT);
      expect(node.position).toEqual({ x: 100, y: 200 });
      expect(node.inputs).toEqual([]);
      expect(node.outputs).toEqual([]);
      expect(node.data).toEqual({});
    });

    it('should add input port', () => {
      const node = new WorkflowNode('test-node', NodeType.PROCESS);
      node.addInput('input1', 'string');

      expect(node.inputs).toHaveLength(1);
      expect(node.inputs[0]).toEqual({ id: 'input1', type: 'string', connected: false });
    });

    it('should add output port', () => {
      const node = new WorkflowNode('test-node', NodeType.PROCESS);
      node.addOutput('output1', 'number');

      expect(node.outputs).toHaveLength(1);
      expect(node.outputs[0]).toEqual({ id: 'output1', type: 'number', connected: false });
    });

    it('should set node data', () => {
      const node = new WorkflowNode('test-node', NodeType.PROCESS);
      node.setData('prompt', 'Test prompt');

      expect(node.data.prompt).toBe('Test prompt');
    });

    it('should execute node process function', async () => {
      const node = new WorkflowNode('test-node', NodeType.PROCESS);
      node.process = async (inputs) => ({ result: inputs.value * 2 });

      node.addInput('value', 'number');
      node.addOutput('result', 'number');

      const result = await node.execute({ value: 5 });
      expect(result.result).toBe(10);
    });
  });

  describe('WorkflowConnection', () => {
    it('should create connection between nodes', () => {
      const sourceNode = new WorkflowNode('source', NodeType.INPUT);
      sourceNode.addOutput('out1', 'string');

      const targetNode = new WorkflowNode('target', NodeType.PROCESS);
      targetNode.addInput('in1', 'string');

      const connection = new WorkflowConnection(
        sourceNode,
        'out1',
        targetNode,
        'in1'
      );

      expect(connection.sourceNode).toBe(sourceNode);
      expect(connection.sourcePort).toBe('out1');
      expect(connection.targetNode).toBe(targetNode);
      expect(connection.targetPort).toBe('in1');
    });

    it('should validate connection types', () => {
      const sourceNode = new WorkflowNode('source', NodeType.INPUT);
      sourceNode.addOutput('out1', 'string');

      const targetNode = new WorkflowNode('target', NodeType.PROCESS);
      targetNode.addInput('in1', 'number');

      expect(() => {
        new WorkflowConnection(sourceNode, 'out1', targetNode, 'in1');
      }).toThrow('Type mismatch: cannot connect string to number');
    });
  });

  describe('WorkflowEngine', () => {
    let engine;

    beforeEach(() => {
      engine = new WorkflowEngine();
    });

    it('should add nodes to workflow', () => {
      const node = new WorkflowNode('node1', NodeType.INPUT);
      engine.addNode(node);

      expect(engine.nodes.size).toBe(1);
      expect(engine.nodes.get('node1')).toBe(node);
    });

    it('should add connections between nodes', () => {
      const inputNode = new WorkflowNode('input1', NodeType.INPUT);
      inputNode.addOutput('output', 'string');

      const processNode = new WorkflowNode('process1', NodeType.PROCESS);
      processNode.addInput('input', 'string');

      engine.addNode(inputNode);
      engine.addNode(processNode);

      engine.addConnection('input1', 'output', 'process1', 'input');

      expect(engine.connections).toHaveLength(1);
      expect(engine.connections[0].sourceNode.id).toBe('input1');
      expect(engine.connections[0].targetNode.id).toBe('process1');
    });

    it('should execute workflow in correct order', async () => {
      const inputNode = new WorkflowNode('input1', NodeType.INPUT);
      inputNode.addOutput('value', 'number');
      inputNode.setData('value', 10);

      const multiplyNode = new WorkflowNode('multiply', NodeType.PROCESS);
      multiplyNode.addInput('input', 'number');
      multiplyNode.addOutput('result', 'number');
      multiplyNode.process = async (inputs) => ({ result: inputs.input * 2 });

      const outputNode = new WorkflowNode('output1', NodeType.OUTPUT);
      outputNode.addInput('value', 'number');

      engine.addNode(inputNode);
      engine.addNode(multiplyNode);
      engine.addNode(outputNode);

      engine.addConnection('input1', 'value', 'multiply', 'input');
      engine.addConnection('multiply', 'result', 'output1', 'value');

      const results = await engine.execute();

      expect(results.output1).toEqual({ value: 20 });
    });

    it('should detect cycles in workflow', () => {
      const node1 = new WorkflowNode('node1', NodeType.PROCESS);
      node1.addInput('in1', 'string');
      node1.addOutput('out1', 'string');

      const node2 = new WorkflowNode('node2', NodeType.PROCESS);
      node2.addInput('in2', 'string');
      node2.addOutput('out2', 'string');

      engine.addNode(node1);
      engine.addNode(node2);

      engine.addConnection('node1', 'out1', 'node2', 'in2');
      expect(() => {
        engine.addConnection('node2', 'out2', 'node1', 'in1');
      }).toThrow('Connection would create a cycle');
    });
  });

  describe('ModelRegistry', () => {
    let registry;

    beforeEach(() => {
      registry = new ModelRegistry();
    });

    it('should register a model', () => {
      const model = {
        id: 'test-model',
        name: 'Test Model',
        type: 'image-generation',
        provider: 'muapi',
        parameters: { maxTokens: 100 }
      };

      registry.registerModel(model);

      expect(registry.getModel('test-model')).toEqual(model);
    });

    it('should get models by type', () => {
      const imageModel = {
        id: 'img-model',
        name: 'Image Model',
        type: 'image-generation',
        provider: 'muapi'
      };

      const videoModel = {
        id: 'vid-model',
        name: 'Video Model',
        type: 'video-generation',
        provider: 'muapi'
      };

      registry.registerModel(imageModel);
      registry.registerModel(videoModel);

      const imageModels = registry.getModelsByType('image-generation');
      expect(imageModels).toHaveLength(1);
      expect(imageModels[0]).toBe(imageModel);
    });

    it('should integrate with muapi models', () => {
      // Mock muapi models loading
      const mockModels = [
        { id: 'muapi-img-1', name: 'MuAPI Image 1', type: 'image-generation' },
        { id: 'muapi-vid-1', name: 'MuAPI Video 1', type: 'video-generation' }
      ];

      mockModels.forEach(model => registry.registerModel(model));

      expect(registry.getAllModels()).toHaveLength(2);
    });
  });
});