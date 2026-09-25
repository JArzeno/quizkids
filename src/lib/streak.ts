export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Consecutive days of activity ending today (or yesterday, so the streak
// doesn't reset to 0 before the kid has had a chance to study today).
export function computeStreak(activityDates: Array<string | null | undefined>): number {
  const days = new Set(
    activityDates.filter((d): d is string => !!d).map((iso) => dayKey(new Date(iso)))
  );
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeWeeklyPct(minutesLast7Days: number, goalMinPerDay: number): number {
  const weeklyGoal = Math.max(1, (goalMinPerDay || 30) * 7);
  return Math.min(100, Math.round((minutesLast7Days / weeklyGoal) * 100));
}
