import { NextResponse } from 'next/server';
import { newId, routeReport } from '@paid/domain';
import type { TnsCategory } from '@paid/contracts';
import { withStore } from '../../../../src/server/store';

export async function POST(request: Request) {
  const form = await request.formData();
  const category = String(form.get('category') ?? 'OTHER_PROHIBITED') as TnsCategory;
  const routed = routeReport(category);
  await withStore((uow) =>
    uow.insertAudit({
      id: newId(),
      actor: { actorType: 'PUBLIC', authStrength: 'NONE', requestId: crypto.randomUUID() },
      action: 'TNS_REPORT',
      subjectType: 'tns_case',
      subjectId: newId(),
      reason: `${routed.caseType}:${routed.sla}`,
      createdAt: new Date(),
    }),
  );
  return NextResponse.redirect(new URL('/report', request.url), 303);
}
