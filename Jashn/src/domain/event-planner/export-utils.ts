import { GeneratedEventPlan } from './types';

export function serializePlanToUrlFragment(plan: GeneratedEventPlan): string {
  try {
    const jsonStr = JSON.stringify(plan);
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return encodeURIComponent(window.btoa(unescape(encodeURIComponent(jsonStr))));
    }
    return encodeURIComponent(Buffer.from(jsonStr, 'utf-8').toString('base64'));
  } catch {
    return '';
  }
}

export function deserializePlanFromUrlFragment(fragment: string): GeneratedEventPlan | null {
  try {
    let clean = fragment.startsWith('#') ? fragment.slice(1) : fragment;
    if (clean.startsWith('plan=')) {
      clean = clean.slice('plan='.length);
    }
    const decodedUri = decodeURIComponent(clean);
    let jsonStr = '';
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      jsonStr = decodeURIComponent(escape(window.atob(decodedUri)));
    } else {
      jsonStr = Buffer.from(decodedUri, 'base64').toString('utf-8');
    }
    const parsed = JSON.parse(jsonStr);

    // Validate expected shape to prevent corrupt or tampered payloads
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.id || !parsed.input || !parsed.budget || !parsed.timeline || !parsed.vendors) {
      return null;
    }
    if (!Array.isArray(parsed.budget.categories) || !Array.isArray(parsed.timeline.tasks)) {
      return null;
    }
    return parsed as GeneratedEventPlan;
  } catch {
    return null;
  }
}

export function generateIcsCalendar(plan: GeneratedEventPlan): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jashn//Event Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  for (const task of plan.timeline.tasks) {
    const cleanDate = task.scheduledDate.replace(/-/g, '');
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:jashn-${task.id}-${cleanDate}@jashn.events`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
    lines.push(`SUMMARY:${escapeIcs(task.title)} [${plan.input.eventName}]`);
    lines.push(`DESCRIPTION:${escapeIcs(`Phase: ${task.phase} | Status: ${task.statusText}`)}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function exportPlanAsChecklistText(plan: GeneratedEventPlan): string {
  const b = plan.budget;
  const t = plan.timeline;
  const v = plan.vendors;

  const lines: string[] = [];
  lines.push(`=======================================================`);
  lines.push(` JASHN EVENT PLAN: ${plan.input.eventName.toUpperCase()}`);
  lines.push(` Date: ${plan.input.eventDate} | Guests: ${plan.input.guestCount} | Tier: ${plan.input.budgetTier.toUpperCase()}`);
  lines.push(` Readiness Score: ${plan.readiness.score}/100 (${plan.readiness.level})`);
  lines.push(`=======================================================\n`);

  lines.push(`[1] BUDGET ALLOCATION (${plan.input.currency} ${b.totalBudget.toLocaleString('en-IN')} Total)`);
  lines.push(`-------------------------------------------------------`);
  lines.push(`Contingency Buffer (${b.contingencyPercent}%): ₹${b.contingencyAmount.toLocaleString('en-IN')}`);
  for (const c of b.categories) {
    lines.push(`- ${c.categoryName}: ₹${c.allocatedAmount.toLocaleString('en-IN')} (${c.sharePercent}%) [Status: ${c.varianceStatus}]`);
  }
  lines.push('');

  lines.push(`[2] MILESTONE TIMELINE CHECKLIST`);
  lines.push(`-------------------------------------------------------`);
  for (const task of t.tasks) {
    const mark = task.isCompleted ? '[X]' : '[ ]';
    const crit = task.isCriticalPath ? ' *CRITICAL*' : '';
    lines.push(`${mark} ${task.scheduledDate} | ${task.title}${crit} (${task.statusText})`);
  }
  lines.push('');

  lines.push(`[3] VENDOR PARTNERS & INTERVIEW QUESTIONS`);
  lines.push(`-------------------------------------------------------`);
  for (const vendor of v.vendors) {
    const status = vendor.isBooked ? '[CONFIRMED]' : '[PENDING]';
    lines.push(`${status} ${vendor.role} (Deadline: ${vendor.bookingDeadline}, Budget: ₹${vendor.allocatedBudget.toLocaleString('en-IN')})`);
    for (const q of vendor.questionsToAsk) {
      lines.push(`   ? Question: ${q}`);
    }
  }
  lines.push('\nGenerated cleanly by Jashn Pure Domain Planner. All data preserved locally.');
  return lines.join('\n');
}
