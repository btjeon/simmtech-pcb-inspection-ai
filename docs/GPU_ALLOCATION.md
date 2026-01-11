# GPU 할당 계획

## 📋 개요
심텍 PCB Inspection AI 플랫폼의 GPU 리소스 할당 전략

**업데이트**: 2025-01-11

---

## 🎯 GPU 요구사항

### GPU 필요 서비스
```yaml
AI Inference (8001):
  GPU: 필수
  용도: 실시간 PCB 불량 검출
  우선순위: 최고 (P1)
  특징: 24/7 실행, 낮은 지연시간 필요

AI Training (8002):
  GPU: 필수
  용도: YOLO 모델 학습/재학습
  우선순위: 높음 (P2)
  특징: 배치 작업, 스케줄링 가능

Image Synthesis (8003):
  GPU: 권장
  용도: GAN 기반 불량 이미지 생성
  우선순위: 중간 (P3)
  특징: 온디맨드 실행
```

### GPU 불필요 서비스
```yaml
- Frontend (Next.js)
- Backend Core
- Analytics
- Image Search (CPU + Qdrant)
- Monitoring
```

---

## 🖥️ GPU 환경별 할당 전략

### 시나리오 1: GPU 2개 환경 (권장)

```yaml
GPU 0 (추론 전용):
  Primary:
    - AI Inference (8001)
      - 메모리: 4-6GB
      - 상시 실행
      - 최고 우선순위

  Shared (여유 시):
    - Image Synthesis (8003)
      - 메모리: 2-4GB
      - 온디맨드 실행
      - Inference 우선

GPU 1 (학습 전용):
  Primary:
    - AI Training (8002)
      - 메모리: 8-12GB
      - 배치 작업
      - 스케줄링 가능
```

**Docker Compose 설정:**
```yaml
services:
  ai-inference:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['0']
              capabilities: [gpu]

  ai-training:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['1']
              capabilities: [gpu]

  image-synthesis:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['0']
              capabilities: [gpu]
```

---

### 시나리오 2: GPU 1개 환경

```yaml
GPU 0 (공유):
  우선순위 스케줄링:
    1. AI Inference (8001) - 항상 우선
       메모리: 4-6GB 예약

    2. AI Training (8002) - Inference 미사용 시
       메모리: 나머지 전부
       스케줄: 야간/주말

    3. Image Synthesis (8003) - 낮은 우선순위
       메모리: 2-4GB
       실행 제한: Training 없을 때만
```

**Docker Compose 설정:**
```yaml
services:
  ai-inference:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['0']
              capabilities: [gpu]
        limits:
          memory: 6G

  ai-training:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['0']
              capabilities: [gpu]
    # 수동으로 실행 제어

  image-synthesis:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['0']
              capabilities: [gpu]
```

**실행 순서:**
```bash
# 1. Inference는 항상 실행
docker-compose up -d ai-inference

# 2. Training은 필요 시에만
docker-compose up -d ai-training
# 완료 후
docker-compose stop ai-training

# 3. Synthesis는 독립 실행
docker-compose up -d image-synthesis
docker-compose stop image-synthesis
```

---

### 시나리오 3: GPU 없음 (개발/테스트 환경)

```yaml
AI Inference:
  - CPU 모드로 실행
  - ONNX Runtime (CPU 최적화)
  - 성능: GPU 대비 5-10배 느림
  - 용도: 기능 테스트만

AI Training:
  - 실행 불가 또는 매우 느림
  - 대안: 클라우드 GPU (AWS/GCP)

Image Synthesis:
  - CPU 모드 가능하나 매우 느림
  - 대안: 사전 생성된 이미지 사용
```

---

## 🔧 GPU 메모리 관리

### 메모리 할당 가이드

```yaml
AI Inference:
  모델 크기: YOLOv8 (2-3GB)
  배치 크기: 1-4
  필요 메모리: 4-6GB
  권장: 8GB

AI Training:
  모델 크기: YOLOv8 (2-3GB)
  배치 크기: 16-32
  데이터 로딩: 2-4GB
  필요 메모리: 8-12GB
  권장: 16GB

Image Synthesis:
  GAN 모델: 1-2GB
  배치 크기: 4-8
  필요 메모리: 2-4GB
  권장: 6GB
```

### PyTorch 메모리 최적화

```python
# services/ai-inference/app/core/model_manager.py

import torch

class ModelManager:
    def __init__(self):
        # GPU 메모리 제한
        torch.cuda.set_per_process_memory_fraction(0.6, device=0)

        # 메모리 캐시 비우기
        torch.cuda.empty_cache()

        # Mixed Precision (메모리 절약)
        self.use_amp = True

    def load_model(self):
        model = YOLOv8()
        model = model.cuda()
        model.eval()

        # Gradient 계산 비활성화 (추론 시)
        torch.set_grad_enabled(False)

        return model
```

---

## 📊 GPU 모니터링

### nvidia-smi 명령어

```bash
# GPU 사용률 확인
nvidia-smi

# 실시간 모니터링 (1초마다)
watch -n 1 nvidia-smi

# 특정 GPU만
nvidia-smi -i 0

# 메모리만 확인
nvidia-smi --query-gpu=memory.used,memory.total --format=csv
```

### Docker 컨테이너별 GPU 사용량

```bash
# 실행 중인 컨테이너의 GPU 사용
docker stats pcb-ai-inference pcb-ai-training

# GPU 메모리 확인
nvidia-smi --query-compute-apps=pid,used_memory --format=csv
```

### Prometheus 메트릭 수집

```yaml
# infrastructure/observability/prometheus/prometheus.yml

scrape_configs:
  - job_name: 'nvidia_gpu'
    static_configs:
      - targets: ['node-exporter:9100']
    metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'nvidia_.*'
        action: keep
```

---

## ⚠️ 주의사항

### 1. OOM (Out of Memory) 방지
```python
# 배치 크기 동적 조정
def get_optimal_batch_size():
    gpu_memory = torch.cuda.get_device_properties(0).total_memory

    if gpu_memory < 8 * 1024**3:  # 8GB 미만
        return 1
    elif gpu_memory < 16 * 1024**3:  # 16GB 미만
        return 4
    else:
        return 8
```

### 2. 멀티 프로세스 주의
```yaml
문제:
  - 같은 GPU에 여러 프로세스 동시 실행
  - 메모리 부족 발생 가능

해결:
  - Docker 메모리 제한 설정
  - 프로세스 스케줄링
  - 우선순위 관리
```

### 3. GPU 온도 관리
```bash
# GPU 온도 확인
nvidia-smi --query-gpu=temperature.gpu --format=csv

# 80도 이상 시 알람 (Prometheus)
```

---

## 🚀 최적화 팁

### 1. 모델 최적화
```yaml
ONNX Runtime:
  - PyTorch 모델을 ONNX로 변환
  - 추론 속도 2-3배 향상
  - 메모리 사용 30% 감소

TensorRT:
  - NVIDIA 전용 최적화
  - 추론 속도 5-10배 향상
  - 복잡한 변환 과정
```

### 2. 배치 처리
```python
# 작은 배치 여러번 대신 큰 배치 한번
# Bad
for image in images:
    result = model(image)

# Good
results = model(images_batch)
```

### 3. Mixed Precision
```python
# FP16 사용으로 메모리 50% 절약
from torch.cuda.amp import autocast

with autocast():
    output = model(input)
```

---

## 📈 성능 벤치마크 (참고)

### GPU별 추론 성능 (YOLOv8)

| GPU 모델        | 배치 1 | 배치 4 | 배치 8 | 메모리  |
|----------------|--------|--------|--------|---------|
| RTX 3060 (12GB)| 45 FPS | 120 FPS| 150 FPS| 4-6 GB  |
| RTX 3070 (8GB) | 55 FPS | 140 FPS| 180 FPS| 4-6 GB  |
| RTX 3080 (10GB)| 70 FPS | 180 FPS| 240 FPS| 4-6 GB  |
| RTX 4090 (24GB)| 120 FPS| 300 FPS| 450 FPS| 4-6 GB  |

### 학습 시간 (1 epoch, 1000 images)

| GPU 모델        | 시간    | 배치 크기 | 메모리   |
|----------------|---------|----------|---------|
| RTX 3060       | 45분    | 16       | 10 GB   |
| RTX 3070       | 35분    | 16       | 10 GB   |
| RTX 3080       | 25분    | 32       | 12 GB   |
| RTX 4090       | 12분    | 64       | 16 GB   |

---

## 📝 체크리스트

### 배포 전 확인사항

```yaml
☐ NVIDIA Driver 설치 확인
  nvidia-smi 실행 가능

☐ Docker GPU 지원 확인
  docker run --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi

☐ GPU 개수 확인
  nvidia-smi -L

☐ 메모리 충분한지 확인
  각 서비스 메모리 요구사항 vs 실제 GPU 메모리

☐ docker-compose.yml GPU 설정 확인
  device_ids 올바른지

☐ 모니터링 설정
  Prometheus + Grafana GPU 메트릭
```

---

**문서 버전**: 1.0
**최종 업데이트**: 2025-01-11
**권장 GPU**: NVIDIA RTX 3060 이상 (12GB VRAM)
