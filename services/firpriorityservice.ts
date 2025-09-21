// FIR Priority Service

export interface FIR {
  id: string;
  title: string;
  description: string;
  location: string;
  timestamp: Date;
  status: string;
  priority?: string;
  assignedTo?: string;
  tags?: string[];
  evidence?: string[];
  biasAudit?: any;
  // Additional properties needed for consumer/verify page
  priorityScore?: number;
  category?: string;
  reportedBy?: string;
  evidenceFiles?: Array<{
    name: string;
    type: string;
    url: string;
    verified: boolean;
  }>;
  linkedCases?: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

export class FIRPriorityService {
  // Mock implementation
  async getPriorities() {
    return [
      { id: '1', name: 'High', color: 'red' },
      { id: '2', name: 'Medium', color: 'yellow' },
      { id: '3', name: 'Low', color: 'green' }
    ];
  }

  async calculateFIRPriorityScore(fir: FIR): Promise<number> {
    // Calculate a composite score based on all factors
    const urgency = await this.calculateUrgencyScore(fir);
    const severity = await this.calculateSeverityScore(fir);
    const publicImpact = await this.calculatePublicImpactScore(fir);
    const repeatOffender = await this.calculateRepeatOffenderScore(fir);
    const geographicalHotspot = await this.calculateGeographicalHotspotScore(fir);
    
    return urgency * 0.3 + severity * 0.3 + publicImpact * 0.2 + repeatOffender * 0.1 + geographicalHotspot * 0.1;
  }

  async calculateUrgencyScore(fir: FIR): Promise<number> {
    // Mock implementation - in real app would use ML or rules
    return Math.random() * 10;
  }

  async calculateSeverityScore(fir: FIR): Promise<number> {
    // Mock implementation - in real app would use ML or rules
    return Math.random() * 10;
  }

  async calculatePublicImpactScore(fir: FIR): Promise<number> {
    // Mock implementation - in real app would use ML or rules
    return Math.random() * 10;
  }

  async calculateRepeatOffenderScore(fir: FIR): Promise<number> {
    // Mock implementation - in real app would use ML or rules
    return Math.random() * 10;
  }

  async calculateGeographicalHotspotScore(fir: FIR): Promise<number> {
    // Mock implementation - in real app would use ML or rules
    return Math.random() * 10;
  }
}