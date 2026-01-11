-- PostgreSQL 초기화 스크립트
-- PCB Inspection AI Platform

-- ========================================
-- 1. 데이터베이스 생성
-- ========================================

-- MLflow용 데이터베이스 (이미 환경변수로 생성됨)
-- CREATE DATABASE mlflow;

-- ========================================
-- 2. 스키마 생성 (서비스별 분리)
-- ========================================

-- Frontend 스키마 (Next.js + Prisma)
CREATE SCHEMA IF NOT EXISTS public;

-- AI Inference 스키마
CREATE SCHEMA IF NOT EXISTS ai_inference;

-- AI Training 스키마
CREATE SCHEMA IF NOT EXISTS ai_training;

-- Image Synthesis 스키마
CREATE SCHEMA IF NOT EXISTS image_synthesis;

-- Image Search 스키마
CREATE SCHEMA IF NOT EXISTS image_search;

-- Analytics 스키마
CREATE SCHEMA IF NOT EXISTS analytics;

-- AI Spec 스키마 (고객사 Spec 관리)
CREATE SCHEMA IF NOT EXISTS ai_spec;

-- ========================================
-- 3. 확장 기능 설치
-- ========================================

-- UUID 생성용
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PostgreSQL 버전 정보
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ========================================
-- 4. 기본 테이블 생성 (Frontend - Next.js)
-- ========================================

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'operator', -- operator, engineer, admin
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 제품 테이블
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    customer VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_by INT REFERENCES public.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 세션 테이블 (NextAuth)
CREATE TABLE IF NOT EXISTS public.sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id INT REFERENCES public.users(id),
    expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_by INT REFERENCES public.users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 5. AI Inference 테이블
-- ========================================

CREATE TABLE IF NOT EXISTS ai_inference.inference_jobs (
    id SERIAL PRIMARY KEY,
    job_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    image_path VARCHAR(500) NOT NULL,
    model_id INT,
    model_version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    result JSONB,
    confidence FLOAT,
    inference_time_ms INT,
    error_message TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_inference_status ON ai_inference.inference_jobs(status);
CREATE INDEX idx_inference_created_at ON ai_inference.inference_jobs(created_at DESC);

-- ========================================
-- 6. AI Training 테이블
-- ========================================

CREATE TABLE IF NOT EXISTS ai_training.training_jobs (
    id SERIAL PRIMARY KEY,
    job_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    dataset_id INT,
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    epochs INT,
    batch_size INT,
    learning_rate FLOAT,
    metrics JSONB, -- loss, accuracy, mAP, etc.
    mlflow_run_id VARCHAR(255),
    training_time_minutes INT,
    error_message TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_training.datasets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    images_count INT,
    annotations_count INT,
    storage_path VARCHAR(500),
    validation_status VARCHAR(50), -- valid, invalid, pending
    validation_errors JSONB,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_status ON ai_training.training_jobs(status);
CREATE INDEX idx_training_created_at ON ai_training.training_jobs(created_at DESC);

-- ========================================
-- 7. Image Synthesis 테이블
-- ========================================

CREATE TABLE IF NOT EXISTS image_synthesis.synthesis_jobs (
    id SERIAL PRIMARY KEY,
    job_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    defect_type VARCHAR(100) NOT NULL,
    num_images INT NOT NULL,
    gan_model_version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    output_paths JSONB,
    synthesis_time_ms INT,
    error_message TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_synthesis_status ON image_synthesis.synthesis_jobs(status);

-- ========================================
-- 8. Image Search 테이블
-- ========================================

CREATE TABLE IF NOT EXISTS image_search.search_history (
    id SERIAL PRIMARY KEY,
    query_image_path VARCHAR(500) NOT NULL,
    query_embedding BYTEA, -- 벡터 임베딩 (실제로는 Qdrant 사용)
    results JSONB,
    search_time_ms INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS image_search.image_index (
    id SERIAL PRIMARY KEY,
    image_path VARCHAR(500) UNIQUE NOT NULL,
    defect_type VARCHAR(100),
    metadata JSONB,
    qdrant_id VARCHAR(100), -- Qdrant의 point ID
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_image_defect_type ON image_search.image_index(defect_type);

-- ========================================
-- 9. Analytics 테이블
-- ========================================

CREATE TABLE IF NOT EXISTS analytics.daily_metrics (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    total_inferences INT DEFAULT 0,
    successful_inferences INT DEFAULT 0,
    failed_inferences INT DEFAULT 0,
    avg_inference_time_ms FLOAT,
    total_training_jobs INT DEFAULT 0,
    metrics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_metrics_date ON analytics.daily_metrics(date DESC);

-- ========================================
-- 10. 초기 데이터 삽입
-- ========================================

-- 기본 관리자 계정 (비밀번호는 애플리케이션에서 해시화 필요)
INSERT INTO public.users (email, name, role)
VALUES
    ('admin@simmtech.com', '시스템 관리자', 'admin'),
    ('engineer@simmtech.com', '엔지니어', 'engineer'),
    ('operator@simmtech.com', '작업자', 'operator')
ON CONFLICT (email) DO NOTHING;

-- 기본 시스템 설정
INSERT INTO public.settings (key, value, description)
VALUES
    ('inference_threshold', '0.5', 'AI 추론 신뢰도 임계값'),
    ('max_training_epochs', '100', '최대 학습 에포크'),
    ('image_retention_days', '90', '이미지 보관 기간 (일)')
ON CONFLICT (key) DO NOTHING;

-- ========================================
-- 11. 권한 설정
-- ========================================

-- 모든 스키마에 대한 권한 부여
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA ai_inference TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA ai_training TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA image_synthesis TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA image_search TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA analytics TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA ai_spec TO postgres;

-- 모든 테이블에 대한 권한
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai_inference TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai_training TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA image_synthesis TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA image_search TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai_spec TO postgres;

-- 시퀀스 권한
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ai_inference TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ai_training TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA image_synthesis TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA image_search TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA analytics TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ai_spec TO postgres;

-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PCB Inspection AI Database Initialized';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Schemas created: 7';
    RAISE NOTICE 'Tables created: 13+';
    RAISE NOTICE 'Initial users: 3';
    RAISE NOTICE 'Ready for application connection';
    RAISE NOTICE '========================================';
END $$;
