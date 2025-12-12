import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { useDatabaseContext } from '@/contexts/DatabaseContext'
import type { Project } from '@/types/project'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ProjectSelectorProps {
  value: string | undefined
  onChange: (projectName: string | undefined) => void
  placeholder?: string
  className?: string
}

export function ProjectSelector({
  value,
  onChange,
  placeholder = 'Select project...',
  className = '',
}: ProjectSelectorProps): ReactElement {
  const { db } = useDatabaseContext()
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load projects from database
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current !== null && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsCreating(false)
        setNewProjectName('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = useCallback(
    (projectName: string | undefined): void => {
      onChange(projectName)
      setIsOpen(false)
    },
    [onChange]
  )

  const handleCreateProject = useCallback(async (): Promise<void> => {
    if (db === null || newProjectName.trim() === '') return

    const now = new Date().toISOString()
    const newProject: Project = {
      id: `project-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`,
      name: newProjectName.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    await db.projects.insert(newProject)
    onChange(newProject.name)
    setNewProjectName('')
    setIsCreating(false)
    setIsOpen(false)
  }, [db, newProjectName, onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter') {
        e.preventDefault()
        void handleCreateProject()
      } else if (e.key === 'Escape') {
        setIsCreating(false)
        setNewProjectName('')
      }
    },
    [handleCreateProject]
  )

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(): void => {
          setIsOpen(!isOpen)
        }}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
      >
        <span className={value !== undefined ? '' : 'text-gray-400 dark:text-gray-500'}>
          {value ?? placeholder}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="max-h-60 overflow-y-auto py-1">
            {/* No project option */}
            <button
              type="button"
              onClick={(): void => {
                handleSelect(undefined)
              }}
              className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                value === undefined
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-gray-400">No project</span>
            </button>

            {/* Existing projects */}
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={(): void => {
                  handleSelect(project.name)
                }}
                className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  value === project.name
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="mr-2">📁</span>
                {project.name}
              </button>
            ))}

            {projects.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                No projects yet
              </div>
            )}
          </div>

          {/* Create new project */}
          <div className="border-t border-gray-200 p-2 dark:border-gray-700">
            {isCreating ? (
              <div className="flex gap-2">
                <Input
                  value={newProjectName}
                  onChange={(e): void => {
                    setNewProjectName(e.target.value)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Project name"
                  className="flex-1 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={(): void => {
                    void handleCreateProject()
                  }}
                >
                  Add
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(): void => {
                  setIsCreating(true)
                }}
                className="flex w-full items-center rounded px-2 py-1.5 text-sm text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create new project
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
