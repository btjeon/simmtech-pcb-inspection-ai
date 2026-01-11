/**
 * Inference Execution API Route
 * AI 추론 오케스트레이션 (FastAPI 호출)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aiClient } from '@/lib/ai-client';

/**
 * POST /api/inference/execute
 * AI 추론 실행 요청
 *
 * 흐름:
 * 1. 요청 검증
 * 2. DB에 추론 요청 저장
 * 3. FastAPI로 비동기 전달
 * 4. 즉시 응답 반환
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lotId, bundleId, customerId, productId, imageUrl } = body;

    // 1. 요청 검증
    if (!lotId || !bundleId || !customerId || !productId) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: '고객사를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: '제품을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 2. DB에 추론 요청 저장
    const inference = await prisma.inference.create({
      data: {
        lotId,
        bundleId,
        customerId,
        productId,
        imageUrl,
        status: 'PENDING',
        requestedAt: new Date(),
      },
    });

    // 3. FastAPI로 비동기 전달 (백그라운드)
    aiClient
      .requestInference({
        inferenceId: inference.id,
        lotId,
        bundleId,
        customerId,
        imageUrl,
      })
      .catch((error) => {
        console.error('AI service error:', error);
        // 에러 발생 시 DB 상태 업데이트
        prisma.inference
          .update({
            where: { id: inference.id },
            data: { status: 'FAILED' },
          })
          .catch(console.error);
      });

    // 4. 즉시 응답
    return NextResponse.json({
      inferenceId: inference.id,
      status: 'pending',
      message: '추론 요청이 접수되었습니다.',
    });
  } catch (error) {
    console.error('Error executing inference:', error);
    return NextResponse.json(
      { error: '추론 요청 실패' },
      { status: 500 }
    );
  }
}
