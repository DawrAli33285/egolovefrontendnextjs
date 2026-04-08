import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/adminpageauth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth check
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
  }

  try {
    await prisma.quizQuestion.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: id });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Delete failed' }, { status: 500 });
  }
}
