import { type ReactElement, useEffect, useState } from 'react'
import { useDatabaseContext } from '@/contexts/DatabaseContext'
import { useUIStore } from '@/stores/ui.store'
import type { TaskContext, TaskEnergy } from '@/types/task'
import type { Project } from '@/types/project'
import { Badge } from '@/components/ui/Badge'
import { CONTEXT_CONFIG } from '@/components/ui/ContextBadge'

interface TaskFiltersProps {
  className?: string
}

const CONTEXTS: TaskContext[] = ['computer', 'phone', 'errands', 'home', 'anywhere']
const ENERGIES: TaskEnergy[] = ['high', 'medium', 'low']

const ENERGY_LABELS: Record<TaskEnergy, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function FilterChip({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string
  icon?: string
  isActive: boolean
  onClick: () => void
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {icon !== undefined && <span>{icon}</span>}
      {label}
      {isActive && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </button>
  )
}

export function TaskFilters({ className = '' }: TaskFiltersProps): ReactElement {
  const { db } = useDatabaseContext()
  const [projects, setProjects] = useState<Project[]>([])
  const {
    filters,
    setContextFilter,
    setEnergyFilter,
    setProjectFilter,
    setShowCompleted,
    clearFilters,
  } = useUIStore()

  // Load projects for filter options
  useEffect(() => {
    if (db === null) return

    const subscription = db.projects
      .find()
      .where('isActive')
      .equals(true)
      .sort({ name: 'asc' })
      .$.subscribe({
        next: (docs) => {
          const loadedProjects = docs.map((doc) => doc.toJSON() as Project)
          setProjects(loadedProjects)
        },
      })

    return (): void => {
      subscription.unsubscribe()
    }
  }, [db])

  // Count active filters
  const activeFilterCount = [
    filters.context !== null,
    filters.energy !== null,
    filters.project !== null,
    filters.showCompleted,
  ].filter(Boolean).length

  const handleContextClick = (context: TaskContext): void => {
    setContextFilter(filters.context === context ? null : context)
  }

  const handleEnergyClick = (energy: TaskEnergy): void => {
    setEnergyFilter(filters.energy === energy ? null : energy)
  }

  const handleProjectClick = (projectName: string): void => {
    setProjectFilter(filters.project === projectName ? null : projectName)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with active filter count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="primary" size="sm">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Context filters */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Context
        </p>
        <div className="flex flex-wrap gap-2">
          {CONTEXTS.map((context) => (
            <FilterChip
              key={context}
              label={CONTEXT_CONFIG[context].label}
              icon={CONTEXT_CONFIG[context].icon}
              isActive={filters.context === context}
              onClick={(): void => {
                handleContextClick(context)
              }}
            />
          ))}
        </div>
      </div>

      {/* Energy filters */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Energy
        </p>
        <div className="flex flex-wrap gap-2">
          {ENERGIES.map((energy) => (
            <FilterChip
              key={energy}
              label={ENERGY_LABELS[energy]}
              isActive={filters.energy === energy}
              onClick={(): void => {
                handleEnergyClick(energy)
              }}
            />
          ))}
        </div>
      </div>

      {/* Project filters */}
      {projects.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Project
          </p>
          <div className="flex flex-wrap gap-2">
            {projects.map((project) => (
              <FilterChip
                key={project.id}
                label={project.name}
                icon="📁"
                isActive={filters.project === project.name}
                onClick={(): void => {
                  handleProjectClick(project.name)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Show completed toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={filters.showCompleted}
          onClick={(): void => {
            setShowCompleted(!filters.showCompleted)
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            filters.showCompleted ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
              filters.showCompleted ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">Show completed</span>
      </div>
    </div>
  )
}
