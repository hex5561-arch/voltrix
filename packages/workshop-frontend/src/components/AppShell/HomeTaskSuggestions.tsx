import { useMemo } from 'react'
import {
  BookOpen,
  Calculator,
  Cards,
  FileText,
  GraduationCap,
  type Icon,
} from '@phosphor-icons/react'

// A few example academic tasks shown under the Home composer, so a student immediately sees the kind
// of thing they can ask for. Picking one drops a starter prompt into the composer.
type TaskSuggestion = {
  id: string
  label: string
  description: string
  prompt: string
  icon: Icon
}

const SUGGESTIONS: TaskSuggestion[] = [
  {
    id: 'math-solver',
    label: 'Solve STEM or math problem',
    description: 'Step-by-step derivation with formulas and clear explanations',
    icon: Calculator,
    prompt:
      'Solve this problem step-by-step with clear derivations, definitions, and LaTeX formulas. Highlight the final answer clearly.',
  },
  {
    id: 'flashcards',
    label: 'Generate flashcards (SM-2)',
    description: 'Turn notes or topics into active recall flashcards with spaced repetition',
    icon: Cards,
    prompt:
      'Create 15 high-yield active recall flashcards on this topic with clear questions and concise answers for spaced repetition review.',
  },
  {
    id: 'exam-predict',
    label: 'Predict exam questions',
    description: 'Forecast likely exam questions, essay prompts, and marking guides',
    icon: GraduationCap,
    prompt:
      'Predict the most probable university exam questions for this subject, including both short conceptual questions and long problems with sample solutions.',
  },
  {
    id: 'essay-review',
    label: 'Review academic paper / draft',
    description: 'Audit structure, argument coherence, academic tone, and originality',
    icon: FileText,
    prompt:
      'Review my attached draft for academic tone, structural flow, argument strength, and suggest concrete improvements.',
  },
  {
    id: 'research',
    label: 'Scholarly literature & citations',
    description: 'Explore research findings and format citations in APA, IEEE, or Chicago',
    icon: BookOpen,
    prompt:
      'Summarize current scholarly literature on this topic with key findings, methodology comparisons, and standard citations.',
  },
]

// One row, shared by every suggestion so the list reads as one kind of offer.
function SuggestionRow({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="press group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-kumo-tint"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kumo-fill text-kumo-subtle transition-colors group-hover:text-kumo-default">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] leading-[18px] font-medium tracking-[-0.25px] text-kumo-default">
            {label}
          </span>
          <span className="block truncate text-[12px] leading-4 tracking-[-0.2px] text-kumo-subtle">
            {description}
          </span>
        </span>
      </button>
    </li>
  )
}

// How many of the suggestions above to show at once. The list is longer than the page should be:
// four rows is inspiration, seven is a menu to read. Which three appear is chosen per visit, so the
// ones below the fold still get seen -- and so Home doesn't look like it only does one thing.
const VISIBLE_SUGGESTIONS = 3

function pickSuggestions(): TaskSuggestion[] {
  let shuffled = [...SUGGESTIONS]
  for (let i = shuffled.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, VISIBLE_SUGGESTIONS)
}

export default function HomeTaskSuggestions({
  onPick,
}: {
  onPick: (prompt: string) => void
}) {
  // Chosen once per mount: re-rolling on every render would shuffle the list under the pointer.
  const visible = useMemo(pickSuggestions, [])

  return (
    <section aria-label="Example tasks" className="flex flex-col gap-1">
      <h3 className="px-1 pb-1 text-[12px] font-medium uppercase tracking-[0.06em] text-kumo-inactive">
        Get started
      </h3>
      <ul className="flex flex-col gap-0.5">
        {visible.map((suggestion) => (
          <SuggestionRow
            key={suggestion.id}
            icon={<suggestion.icon size={16} />}
            label={suggestion.label}
            description={suggestion.description}
            onClick={() => onPick(suggestion.prompt)}
          />
        ))}
      </ul>
    </section>
  )
}
