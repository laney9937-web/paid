import { NextResponse } from 'next/server';
import { newId } from '@paid/domain';
import { getStore } from '../../../../src/server/store';

export async function POST(request: Request) {
  const form = await request.formData();
  const category = String(form.get('category') ?? 'OTHER_PROHIBITED');
  await getStore().insertAudit({
    id: newId(),
    actor: { actorType: 'PUBLIC', authStrength: 'NONE', requestId: crypto.randomUUID() },
    action: 'TNS_REPORT',
    subjectType: 'report',
    subjectId: newId(),
    reason: category,
    createdAt: new Date(),
  });
  return NextResponse.redirect(new URL('/report', request.url), 303);
}
