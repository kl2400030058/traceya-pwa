// Hotspot Prediction Service
export class HotspotPredictionService {
  // Mock implementation
  async getPredictions() {
    return [
      { id: '1', location: 'Location A', probability: 0.85 },
      { id: '2', location: 'Location B', probability: 0.72 }
    ];
  }
}

export const hotspotPredictionService = new HotspotPredictionService();