// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSemesterVelocity,
  auditProjectDraft,
  getCustomTimetable,
  saveCustomTimetable,
  DEFAULT_TIMETABLE,
} from './temporalAcademicService';

describe('temporalAcademicService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('calculates semester velocity accurately with calendar vs mastery comparison', () => {
    const velocity = calculateSemesterVelocity();

    expect(velocity.currentWeek).toBe(7);
    expect(velocity.totalWeeks).toBe(14);
    expect(velocity.calendarElapsedPct).toBe(50);
    expect(velocity.syllabusMasteryPct).toBe(62);
    expect(velocity.daysToFinalExams).toBe(42);
    expect(velocity.velocityRatio).toBeGreaterThan(1);
    expect(velocity.velocityStatus).toBe('accelerated');
    expect(velocity.burnDownCommentary).toContain('ahead of schedule');
  });

  it('retrieves default timetable and supports custom overrides', () => {
    const timetable = getCustomTimetable();
    expect(timetable.length).toBeGreaterThanOrEqual(DEFAULT_TIMETABLE.length);
    expect(timetable[0].code).toBe('CSC3102');

    const custom = [
      {
        id: 'tt-test',
        code: 'TEST101',
        title: 'Advanced AI Architecture',
        time: '08:00 - 10:00',
        dayOfWeek: 1,
        type: 'lecture' as const,
        location: 'Hall A',
        checklist: ['Review transformers'],
      },
    ];
    saveCustomTimetable(custom);
    expect(getCustomTimetable()).toEqual(custom);
  });

  it('audits a python code project submission and evaluates algorithmic complexity and rubric', () => {
    const code = `
def fft(x):
    """FFT implementation in O(N log N) time complexity with abstract and method benchmarks."""
    import numpy as np
    # Reference: IEEE Signal Processing 2024
    N = len(x)
    if N <= 1: return x
    even = fft(x[0::2])
    odd = fft(x[1::2])
    T = [np.exp(-2j * np.pi * k / N) * odd[k] for k in range(N // 2)]
    return [even[k] + T[k] for k in range(N // 2)] + [even[k] - T[k] for k in range(N // 2)]
`;

    const audited = auditProjectDraft(
      'EEE3002',
      'Fast Fourier Transform Benchmark',
      'fft_chebyshev.py',
      code
    );

    expect(audited.courseCode).toBe('EEE3002');
    expect(audited.fileType).toBe('code');
    expect(audited.critique?.overallScore).toBeGreaterThanOrEqual(75);
    expect(audited.critique?.rubricCompliance.abstract).toBe(true);
    expect(audited.critique?.rubricCompliance.methodology).toBe(true);
    expect(audited.critique?.rubricCompliance.citations).toBe(true);
    expect(audited.critique?.complexityVerdict).toContain('Algorithmic Complexity verified');
  });

  it('audits a technical lab report draft and checks uncertainty analysis', () => {
    const reportText = `
Abstract: This experiment measures the heat capacity of an unknown metallic block using electrical calorimetry.
Methodology: Water was heated and temperature changes measured with a digital thermistor.
Results: Final temperature recorded at 65.4 degrees Celsius.
Error margin: The uncertainty was measured within +- 0.5 degrees.
References: Sears & Zemansky University Physics 14th edition.
`;

    const audited = auditProjectDraft(
      'PHY2204',
      'Specific Heat Capacity Lab Report',
      'calorimetry_lab.pdf',
      reportText
    );

    expect(audited.fileType).toBe('report');
    expect(audited.critique?.rubricCompliance.errorAnalysis).toBe(true);
    expect(audited.critique?.citationCount).toBe(8);
    expect(audited.critique?.overallScore).toBeGreaterThanOrEqual(80);
  });
});
