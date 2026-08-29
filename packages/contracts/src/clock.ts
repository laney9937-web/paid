export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export class FakeClock implements Clock {
  private current: Date;

  constructor(initial = new Date('2026-08-29T16:00:00.000Z')) {
    this.current = new Date(initial);
  }

  now(): Date {
    return new Date(this.current);
  }

  set(next: Date | string): void {
    this.current = new Date(next);
  }

  advance(ms: number): Date {
    this.current = new Date(this.current.getTime() + ms);
    return this.now();
  }

  advanceSeconds(seconds: number): Date {
    return this.advance(seconds * 1000);
  }

  advanceHours(hours: number): Date {
    return this.advance(hours * 3600 * 1000);
  }

  advanceDays(days: number): Date {
    return this.advance(days * 86400 * 1000);
  }
}
