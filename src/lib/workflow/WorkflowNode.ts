export enum NodeType {
  INPUT = 'input',
  PROCESS = 'process',
  OUTPUT = 'output'
}

export interface NodePort {
  id: string;
  type: string;
  connected: boolean;
}

export interface NodePosition {
  x: number;
  y: number;
}

export class WorkflowNode {
  public id: string;
  public type: NodeType;
  public position: NodePosition;
  public inputs: NodePort[] = [];
  public outputs: NodePort[] = [];
  public data: Record<string, any> = {};
  public process?: (inputs: Record<string, any>) => Promise<Record<string, any>>;

  constructor(id: string, type: NodeType, position: NodePosition = { x: 0, y: 0 }) {
    this.id = id;
    this.type = type;
    this.position = position;
  }

  addInput(id: string, type: string): void {
    this.inputs.push({ id, type, connected: false });
  }

  addOutput(id: string, type: string): void {
    this.outputs.push({ id, type, connected: false });
  }

  setData(key: string, value: any): void {
    this.data[key] = value;
  }

  getData(key: string): any {
    return this.data[key];
  }

  async execute(inputs: Record<string, any>): Promise<Record<string, any>> {
    if (!this.process) {
      throw new Error(`Node ${this.id} has no process function defined`);
    }
    return await this.process(inputs);
  }

  connectInput(portId: string): void {
    const port = this.inputs.find(p => p.id === portId);
    if (port) {
      port.connected = true;
    }
  }

  connectOutput(portId: string): void {
    const port = this.outputs.find(p => p.id === portId);
    if (port) {
      port.connected = true;
    }
  }

  disconnectInput(portId: string): void {
    const port = this.inputs.find(p => p.id === portId);
    if (port) {
      port.connected = false;
    }
  }

  disconnectOutput(portId: string): void {
    const port = this.outputs.find(p => p.id === portId);
    if (port) {
      port.connected = false;
    }
  }
}