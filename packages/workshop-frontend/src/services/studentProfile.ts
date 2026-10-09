import {
  UNIVERSITIES,
  PERSONAS,
  ACADEMIC_LEVELS,
  SEMESTERS,
  University,
  SecondarySchool,
  InstitutionSector,
} from '../data/academicData'

export interface EnrolledCourse {
  id: string
  code: string
  name: string
  instructor?: string
  color: string
  semester?: string
  description?: string
  selected?: boolean
}

export interface CohortVariables {
  socraticMode?: boolean;
  examLock?: boolean;
  dailyQueryLimit?: number;
  curriculumFocus?: string;
  allowSharedUploads?: boolean;
}

export interface StudentProfile {
  name?: string
  discipline: string
  disciplineTitle: string
  institutionSector?: InstitutionSector
  university: string
  universityDetails?: University | null
  secondarySchoolDetails?: SecondarySchool | null
  streamOrCombination?: string
  degreeProgram: string
  academicLevel: string
  academicYear: string
  semester: string
  citationStyle: string
  courses: EnrolledCourse[]
  firstGoal?: string
  cohortId?: string
  cohortName?: string
  cohortInstitution?: string
  cohortVariables?: CohortVariables
  subscriptionTier?: 'free' | 'scholar' | 'cohort' | 'campus'
  subscriptionStatus?: 'active' | 'trial' | 'expired'
  subscriptionRenewalDate?: string
  subscriptionInvoiceId?: string
  dailyQueriesLimit?: number
  dailyQueriesUsed?: number
  lastQueryDate?: string
  updatedAt: number
}

const STORAGE_KEY = 'voltrix_student_profile'
const EVENT_NAME = 'voltrix_student_profile_updated'

export function getDefaultStudentProfile(): StudentProfile {
  const p = PERSONAS[0]
  const u = UNIVERSITIES[0]
  return {
    discipline: p.id,
    disciplineTitle: p.title,
    university: u.name,
    universityDetails: u,
    degreeProgram: p.defaultDegrees[0],
    academicLevel: ACADEMIC_LEVELS[0].id,
    academicYear: ACADEMIC_LEVELS[0].years[0],
    semester: SEMESTERS[0],
    citationStyle: p.citation,
    courses: p.defaultCourses.filter(c => c.selected).map(c => ({
      id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: c.code,
      name: c.name,
      instructor: c.instructor,
      color: c.color,
      semester: SEMESTERS[0],
      description: `${c.code} · ${c.name} course workspace`,
      selected: true,
    })),
    updatedAt: Date.now(),
  }
}

export function getStudentProfile(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StudentProfile
  } catch (err) {
    console.warn('Failed to parse student profile from localStorage:', err)
    return null
  }
}

export function saveStudentProfile(patch: Partial<StudentProfile>): StudentProfile {
  const current = getStudentProfile() || getDefaultStudentProfile()
  const updated: StudentProfile = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }))
  } catch (err) {
    console.warn('Failed to save student profile to localStorage:', err)
  }
  return updated
}

export function subscribeStudentProfile(
  callback: (profile: StudentProfile | null) => void
): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<StudentProfile>
    callback(customEvent.detail || getStudentProfile())
  }
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      callback(getStudentProfile())
    }
  })
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
  }
}

export function formatStudentContextPrompt(profile?: StudentProfile | null): string {
  const p = profile ?? getStudentProfile()
  if (!p) return ''
  const namePart = p.name ? `Student: ${p.name} | ` : ''
  const courseList = p.courses.map(c => c.code).join(', ')
  const baseCtx = `[Academic Context: ${namePart}${p.university} | ${p.degreeProgram} (${p.academicYear}) | Discipline: ${p.disciplineTitle} | Citation Style: ${p.citationStyle}${courseList ? ` | Enrolled: ${courseList}` : ''}]`

  const parts = [baseCtx];

  if (p.cohortVariables?.socraticMode) {
    parts.push(`[ACADEMIC INTEGRITY DIRECTIVE - INSTRUCTOR SOCRATIC MODE ACTIVE:
The user is enrolled in an official cohort (${p.cohortName || 'Class Cohort'} at ${p.cohortInstitution || p.university}).
PEDAGOGICAL CONTRACT:
1. NEVER provide direct, complete homework solutions, fully-written essay paragraphs, or copy-pasteable answers.
2. Guide the learner through diagnostic questions, intermediate hints, and concept verification.
3. If the user asks for a final answer or proof, prompt them for their first step or work so far, and confirm whether they have applied the fundamental theorem/formula.]`);
  }

  if (p.cohortVariables?.curriculumFocus) {
    parts.push(`[CURRICULUM SPECIFICATION: Focus on ${p.cohortVariables.curriculumFocus}. Ensure terminology, marking scheme principles, and notation strictly match this syllabus.]`);
  }

  return parts.join('\n\n');
}

export function isExamLocked(profile?: StudentProfile | null): boolean {
  const p = profile ?? getStudentProfile();
  return !!(p?.cohortVariables?.examLock);
}

export function isSocraticMode(profile?: StudentProfile | null): boolean {
  const p = profile ?? getStudentProfile();
  return !!(p?.cohortVariables?.socraticMode);
}

export function canSubmitQuery(profile?: StudentProfile | null): { allowed: boolean; reason?: string } {
  const p = profile ?? getStudentProfile();
  if (!p) return { allowed: true };

  if (p.cohortVariables?.examLock) {
    return {
      allowed: false,
      reason: `Exam Mode Active: AI querying is temporarily restricted during test hours by your instructor for ${p.cohortName || 'your cohort'}.`
    };
  }

  const limit = p.cohortVariables?.dailyQueryLimit ?? 50;
  const today = new Date().toISOString().slice(0, 10);
  const used = p.lastQueryDate === today ? (p.dailyQueriesUsed ?? 0) : 0;

  if (used >= limit) {
    return {
      allowed: false,
      reason: `Daily query allowance reached (${used}/${limit} queries). Limit resets tomorrow.`
    };
  }

  return { allowed: true };
}

export function recordQueryUsage(): void {
  const p = getStudentProfile();
  if (!p) return;
  const today = new Date().toISOString().slice(0, 10);
  const currentUsed = p.lastQueryDate === today ? (p.dailyQueriesUsed ?? 0) : 0;
  saveStudentProfile({
    dailyQueriesUsed: currentUsed + 1,
    lastQueryDate: today,
  });
}

export function bindCohortToProfile(cohortData: {
  cohortId: string;
  cohortName: string;
  institution: string;
  variables: CohortVariables;
}): void {
  saveStudentProfile({
    cohortId: cohortData.cohortId,
    cohortName: cohortData.cohortName,
    cohortInstitution: cohortData.institution,
    cohortVariables: cohortData.variables,
  });
}

