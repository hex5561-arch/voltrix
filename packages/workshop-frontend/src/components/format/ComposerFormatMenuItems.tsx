import { useState } from 'react'
import { DropdownMenu } from '@cloudflare/kumo'
import { CaretDown, CaretRight, GraduationCap } from '@phosphor-icons/react'
import type { OutputFormatOffer } from '@gadgets/workshop-shared/api'
import { FormatGlyph } from './FormatVisuals'
import { useOutputFormats } from './useOutputFormats'

// Matches the surrounding items in the composer menu, which are quieter and rounder than the
// app-wide MENU_ITEM.
const COMPOSER_MENU_ITEM =
  '!h-auto rounded-xl !px-2 !py-1.5 text-[12px] leading-4 font-normal tracking-[-0.15px] ' +
  'text-kumo-subtle transition-colors data-highlighted:bg-kumo-tint/70 data-highlighted:text-kumo-default cursor-pointer'

// Option B: Academic templates for university students (hidden behind expandable menu)
const ACADEMIC_PRESETS: OutputFormatOffer[] = [
  {
    blueprintId: "academic-lab-report",
    description: "Structured academic lab report format",
    requiresSetup: false,
    output: {
      id: "academic-lab-report",
      noun: "Lab Report",
      plural: "Lab Reports",
      icon: "fileText",
    },
  },
  {
    blueprintId: "academic-paper",
    description: "Scholarly research paper structure with citations",
    requiresSetup: false,
    output: {
      id: "academic-paper",
      noun: "Academic Paper",
      plural: "Academic Papers",
      icon: "fileText",
    },
  },
  {
    blueprintId: "academic-notes",
    description: "Organized lecture and revision notes",
    requiresSetup: false,
    output: {
      id: "academic-notes",
      noun: "Revision Notes",
      plural: "Revision Notes",
      icon: "notebook",
    },
  },
  {
    blueprintId: "academic-flashcards",
    description: "High-yield flashcard decks with spaced repetition",
    requiresSetup: false,
    output: {
      id: "academic-flashcards",
      noun: "Flashcards",
      plural: "Flashcards",
      icon: "listChecks",
    },
  },
  {
    blueprintId: "academic-exam-prep",
    description: "Exam review sheet with practice problems",
    requiresSetup: false,
    output: {
      id: "academic-exam-prep",
      noun: "Exam Prep",
      plural: "Exam Preps",
      icon: "fileText",
    },
  },
]

export default function ComposerFormatMenuItems({
  onSelect,
}: {
  onSelect: (format: OutputFormatOffer) => void
}) {
  const { formats, creating, create } = useOutputFormats()
  const [showAcademic, setShowAcademic] = useState(false)

  // Filter out the generic "Doc" and "Slides" blueprints so they do not clutter the prompt bar
  const filteredFormats = formats.filter(
    (f) => f.output.noun !== "Doc" && f.output.noun !== "Slides"
  )

  const choose = (format: OutputFormatOffer) =>
    format.requiresSetup ? create(format) : onSelect(format)

  return (
    <>
      {filteredFormats.length > 0 && (
        <>
          <p className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase leading-4 tracking-[0.06em] text-kumo-inactive">
            Start with
          </p>
          {filteredFormats.map((format) => (
            <DropdownMenu.Item
              key={format.blueprintId}
              className={COMPOSER_MENU_ITEM}
              disabled={creating !== null}
              onClick={() => choose(format)}
            >
              <span className="mr-2 inline-flex h-4 w-4 items-center justify-center text-kumo-inactive">
                <FormatGlyph
                  output={format.output}
                  size="md"
                  className={creating === format.blueprintId ? 'animate-pulse' : undefined}
                />
              </span>
              <span className="flex-1 truncate">
                {creating === format.blueprintId ? 'Creating…' : format.output.noun}
              </span>
            </DropdownMenu.Item>
          ))}
          <div className="my-1 border-t border-kumo-line/70" />
        </>
      )}

      {/* Option B: Academic Templates - tucked away / hidden until clicked */}
      <DropdownMenu.Item
        className={COMPOSER_MENU_ITEM}
        onSelect={(e) => {
          e.preventDefault()
          setShowAcademic((prev) => !prev)
        }}
      >
        <span className="mr-2 inline-flex h-4 w-4 items-center justify-center text-kumo-inactive">
          <GraduationCap size={14} />
        </span>
        <span className="flex-1 truncate">Academic Templates</span>
        {showAcademic ? (
          <CaretDown size={12} className="text-kumo-inactive" />
        ) : (
          <CaretRight size={12} className="text-kumo-inactive" />
        )}
      </DropdownMenu.Item>

      {showAcademic && (
        <div className="pl-2 border-l border-kumo-line/50 my-1 flex flex-col gap-0.5">
          {ACADEMIC_PRESETS.map((preset) => (
            <DropdownMenu.Item
              key={preset.blueprintId}
              className={COMPOSER_MENU_ITEM}
              onClick={() => choose(preset)}
            >
              <span className="mr-2 inline-flex h-4 w-4 items-center justify-center text-kumo-inactive">
                <FormatGlyph output={preset.output} size="md" />
              </span>
              <span className="flex-1 truncate">{preset.output.noun}</span>
            </DropdownMenu.Item>
          ))}
        </div>
      )}
      <div className="my-1 border-t border-kumo-line/70" />
    </>
  )
}
