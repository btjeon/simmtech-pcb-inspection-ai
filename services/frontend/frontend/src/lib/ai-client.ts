/**
 * AI Backend Client
 * FastAPI 백엔드와 통신하는 클라이언트
 */

import axios, { AxiosInstance } from 'axios';

const AI_API_URL = process.env.AI_API_URL || 'http://localhost:8000';

class AIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: AI_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * AI 추론 요청
   */
  async requestInference(data: {
    inferenceId: string;
    lotId: string;
    bundleId: string;
    customerId: string;
    imageUrl?: string;
  }) {
    const response = await this.client.post('/api/v1/inference', data);
    return response.data;
  }

  /**
   * 배치 추론 요청
   */
  async requestBatchInference(data: {
    batchId: string;
    images: string[];
    customerId: string;
    productId: string;
  }) {
    const response = await this.client.post('/api/v1/inference/batch', data);
    return response.data;
  }

  /**
   * 학습 시작
   */
  async startTraining(data: {
    jobId: string;
    modelName: string;
    datasetId: string;
    config: Record<string, any>;
  }) {
    const response = await this.client.post('/api/v1/training/start', data);
    return response.data;
  }

  /**
   * 학습 상태 조회
   */
  async getTrainingStatus(jobId: string) {
    const response = await this.client.get(`/api/v1/training/${jobId}/status`);
    return response.data;
  }

  /**
   * 이미지 합성 (GAN)
   */
  async synthesizeImages(data: {
    defectType: string;
    count: number;
    baseImageUrl?: string;
  }) {
    const response = await this.client.post('/api/v1/images/synthesis', data);
    return response.data;
  }

  /**
   * 헬스 체크
   */
  async healthCheck() {
    const response = await this.client.get('/api/ai/health');
    return response.data;
  }
}

export const aiClient = new AIClient();
export default aiClient;
