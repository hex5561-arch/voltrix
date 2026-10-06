import {
  UNIVERSITIES,
  PERSONAS,
  ACADEMIC_LEVELS,
  SEMESTERS,
  University,
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

export interface StudentProfile {
  discipline: string
  disciplineTitle: string
  university: string
  universityDetails?: University | null
  degreeProgram: string
  academicLevel: string
  academicYear: string
  semester: string
  citationStyle: string
  courses: EnrolledCourse[]
  firstGoal?: string
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
  const courseList = p.courses.map(c => c.code).join(', ')
  return `[Academic Context: ${p.university} | ${p.degreeProgram} (${p.academicYear}) | Discipline: ${p.disciplineTitle} | Citation Style: ${p.citationStyle}${courseList ? ` | Enrolled: ${courseList}` : ''}]`
}
