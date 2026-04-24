import { WorkflowNode } from './WorkflowNode';
import { WorkflowConnection } from './WorkflowConnection';

export class WorkflowEngine {
  public nodes: Map<string, WorkflowNode> = new Map();
  public connections: WorkflowConnection[] = [];

  addNode(node: WorkflowNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with id '${node.id}' already exists`);
    }
    this.nodes.set(node.id, node);
  }

  removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return;
    }

    // Remove all connections involving this node
    this.connections = this.connections.filter(conn => {
      if (conn.sourceNode.id === nodeId || conn.targetNode.id === nodeId) {
        conn.disconnect();
        return false;
      }
      return true;
    });

    this.nodes.delete(nodeId);
  }

  addConnection(
    sourceNodeId: string,
    sourcePort: string,
    targetNodeId: string,
    targetPort: string
  ): void {
    const sourceNode = this.nodes.get(sourceNodeId);
    const targetNode = this.nodes.get(targetNodeId);

    if (!sourceNode) {
      throw new Error(`Source node '${sourceNodeId}' not found`);
    }

    if (!targetNode) {
      throw new Error(`Target node '${targetNodeId}' not found`);
    }

    // Check for cycles
    if (this.wouldCreateCycle(sourceNodeId, targetNodeId)) {
      throw new Error('Connection would create a cycle');
    }

    const connection = new WorkflowConnection(sourceNode, sourcePort, targetNode, targetPort);
    this.connections.push(connection);
  }

  removeConnection(
    sourceNodeId: string,
    sourcePort: string,
    targetNodeId: string,
    targetPort: string
  ): void {
    const index = this.connections.findIndex(conn =>
      conn.sourceNode.id === sourceNodeId &&
      conn.sourcePort === sourcePort &&
      conn.targetNode.id === targetNodeId &&
      conn.targetPort === targetPort
    );

    if (index !== -1) {
      this.connections[index].disconnect();
      this.connections.splice(index, 1);
    }
  }

  private wouldCreateCycle(fromNodeId: string, toNodeId: string): boolean {
    // Check if there's already a path from toNodeId back to fromNodeId
    return this.canReach(toNodeId, fromNodeId);
  }

  private canReach(fromNodeId: string, toNodeId: string): boolean {
    const visited = new Set<string>();
    const queue = [fromNodeId];
    visited.add(fromNodeId);

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;

      if (currentNodeId === toNodeId) {
        return true;
      }

      const connectedNodes = this.connections
        .filter(conn => conn.sourceNode.id === currentNodeId)
        .map(conn => conn.targetNode.id);

      for (const connectedNodeId of connectedNodes) {
        if (!visited.has(connectedNodeId)) {
          visited.add(connectedNodeId);
          queue.push(connectedNodeId);
        }
      }
    }

    return false;
  }

  async execute(): Promise<Record<string, any>> {
    const executionOrder = this.getExecutionOrder();
    const results: Record<string, any> = {};
    const nodeInputs: Map<string, Record<string, any>> = new Map();

    // Initialize input nodes with their data
    for (const node of this.nodes.values()) {
      if (node.type === 'input') {
        nodeInputs.set(node.id, node.data);
      }
    }

    for (const nodeId of executionOrder) {
      const node = this.nodes.get(nodeId)!;
      const inputs = nodeInputs.get(nodeId) || {};

      // Collect inputs from connected nodes
      const connectedInputs = this.connections.filter(conn => conn.targetNode.id === nodeId);
      for (const conn of connectedInputs) {
        const sourceResult = results[conn.sourceNode.id];
        if (sourceResult && sourceResult[conn.sourcePort] !== undefined) {
          inputs[conn.targetPort] = sourceResult[conn.sourcePort];
        }
      }

      nodeInputs.set(nodeId, inputs);

      if (node.type === 'process') {
        const result = await node.execute(inputs);
        results[nodeId] = result;
      } else if (node.type === 'input' || node.type === 'output') {
        results[nodeId] = inputs;
      }
    }

    return results;
  }

  private getExecutionOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) {
        throw new Error('Cycle detected in workflow');
      }

      if (visited.has(nodeId)) {
        return;
      }

      temp.add(nodeId);

      // Visit all nodes that this node connects to
      const connectedNodes = this.connections
        .filter(conn => conn.sourceNode.id === nodeId)
        .map(conn => conn.targetNode.id);

      for (const connectedNodeId of connectedNodes) {
        visit(connectedNodeId);
      }

      temp.delete(nodeId);
      visited.add(nodeId);
      order.unshift(nodeId);
    };

    // Start with input nodes
    const inputNodes = Array.from(this.nodes.values())
      .filter(node => node.type === 'input')
      .map(node => node.id);

    for (const nodeId of inputNodes) {
      visit(nodeId);
    }

    // Add any remaining nodes (nodes not reachable from inputs)
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }

    return order;
  }

  clear(): void {
    // Disconnect all connections
    for (const connection of this.connections) {
      connection.disconnect();
    }

    this.connections = [];
    this.nodes.clear();
  }

  serialize(): any {
    return {
      nodes: Array.from(this.nodes.values()).map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        inputs: node.inputs,
        outputs: node.outputs,
        data: node.data
      })),
      connections: this.connections.map(conn => ({
        sourceNodeId: conn.sourceNode.id,
        sourcePort: conn.sourcePort,
        targetNodeId: conn.targetNode.id,
        targetPort: conn.targetPort
      }))
    };
  }

  deserialize(data: any): void {
    this.clear();

    // Recreate nodes
    for (const nodeData of data.nodes) {
      const node = new WorkflowNode(nodeData.id, nodeData.type, nodeData.position);
      node.inputs = nodeData.inputs || [];
      node.outputs = nodeData.outputs || [];
      node.data = nodeData.data || {};
      this.addNode(node);
    }

    // Recreate connections
    for (const connData of data.connections) {
      try {
        this.addConnection(
          connData.sourceNodeId,
          connData.sourcePort,
          connData.targetNodeId,
          connData.targetPort
        );
      } catch (error) {
        console.warn(`Failed to restore connection: ${error}`);
      }
    }
  }
}