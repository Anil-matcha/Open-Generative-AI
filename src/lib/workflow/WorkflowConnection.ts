import { WorkflowNode } from './WorkflowNode';

export class WorkflowConnection {
  public sourceNode: WorkflowNode;
  public sourcePort: string;
  public targetNode: WorkflowNode;
  public targetPort: string;

  constructor(
    sourceNode: WorkflowNode,
    sourcePort: string,
    targetNode: WorkflowNode,
    targetPort: string
  ) {
    // Validate that ports exist
    const sourcePortExists = sourceNode.outputs.some(p => p.id === sourcePort);
    const targetPortExists = targetNode.inputs.some(p => p.id === targetPort);

    if (!sourcePortExists) {
      throw new Error(`Source port '${sourcePort}' does not exist on node '${sourceNode.id}'`);
    }

    if (!targetPortExists) {
      throw new Error(`Target port '${targetPort}' does not exist on node '${targetNode.id}'`);
    }

    // Validate type compatibility
    const sourcePortType = sourceNode.outputs.find(p => p.id === sourcePort)?.type;
    const targetPortType = targetNode.inputs.find(p => p.id === targetPort)?.type;

    if (sourcePortType && targetPortType && sourcePortType !== targetPortType) {
      throw new Error(`Type mismatch: cannot connect ${sourcePortType} to ${targetPortType}`);
    }

    this.sourceNode = sourceNode;
    this.sourcePort = sourcePort;
    this.targetNode = targetNode;
    this.targetPort = targetPort;

    // Mark ports as connected
    sourceNode.connectOutput(sourcePort);
    targetNode.connectInput(targetPort);
  }

  disconnect(): void {
    this.sourceNode.disconnectOutput(this.sourcePort);
    this.targetNode.disconnectInput(this.targetPort);
  }

  toString(): string {
    return `${this.sourceNode.id}:${this.sourcePort} -> ${this.targetNode.id}:${this.targetPort}`;
  }
}