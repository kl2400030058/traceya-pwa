'use client';

// AI Service for anomaly detection and analysis

// AIService implementation
class AIService {
  // Methods for AI analysis
  static async analyzeLabCertificate(certificateData: any) {
    // Mock implementation
    return {
      potency: { thc: 20, cbd: 5 },
      recommendation: 'Meets quality standards'
    };
  }
}

export interface QualityMetrics {
  accuracy?: number;
  completeness?: number;
  consistency?: number;
  overallQuality?: number;
  recommendations?: string[];
}

export interface AIAnalysisResult {
  potency: { thc: number, cbd: number };
  recommendation: string;
  passesQualityGates: boolean;
  confidenceScore: number;
  qualityMetrics: QualityMetrics;
  anomalyDetection?: AnomalyDetectionResult;
}

export const aiService = AIService;
export default AIService;

export interface AnomalyDetectionResult {
  batchId: string;
  certificateId: string;
  timestamp: string;
  score: number;
  anomalies: Array<{
    type: 'location' | 'time' | 'quantity' | 'quality' | 'other';
    confidence: number;
    description: string;
    affectedFields: string[];
    recommendation?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    field?: string;
    expectedRange?: string;
    actualValue?: string;
  }>;
  hasAnomalies?: boolean;
}

/**
 * Analyzes batch data for potential anomalies
 * @param batchId The ID of the batch to analyze
 * @returns Promise with anomaly detection results
 */
export async function detectAnomalies(batchId: string): Promise<AnomalyDetectionResult> {
  try {
    const response = await fetch(`/api/ai/analyze-batch?batchId=${batchId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze batch: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in anomaly detection:', error);
    throw error;
  }
}

/**
 * Gets all anomalies detected in the system
 * @returns Promise with array of anomaly detection results
 */
export async function getAllAnomalies(): Promise<AnomalyDetectionResult[]> {
  try {
    const response = await fetch('/api/ai/anomalies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch anomalies: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    return [];
  }
}