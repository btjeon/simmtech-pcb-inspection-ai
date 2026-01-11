/**
 * Customers API Route
 * 고객사 관리 CRUD
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/customers
 * 고객사 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        products: true,
        _count: {
          select: {
            products: true,
            specs: true,
            inferences: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: '고객사 목록 조회 실패' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers
 * 고객사 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description } = body;

    // 유효성 검증
    if (!name || !code) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 중복 체크
    const existing = await prisma.customer.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 고객사 코드입니다' },
        { status: 409 }
      );
    }

    // 고객사 생성
    const customer = await prisma.customer.create({
      data: {
        name,
        code,
        description,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: '고객사 생성 실패' },
      { status: 500 }
    );
  }
}
