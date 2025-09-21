// Repeat Offender Service
export class RepeatOffenderService {
  // Mock implementation
  async getRepeatOffenders() {
    return [
      { id: '1', name: 'John Doe', count: 5 },
      { id: '2', name: 'Jane Smith', count: 3 }
    ];
  }
  
  async detectRepeatOffenders(userId: string) {
    const offenders = await this.getRepeatOffenders();
    return offenders.filter(o => Math.random() > 0.5);
  }
}