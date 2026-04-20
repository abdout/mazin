'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getColumns } from '@/components/platform/task/column'
import { Content } from '@/components/platform/task/content'
import { getTasks, syncProjectsWithTasks } from '@/components/platform/task/actions'
import { Task } from '@/components/platform/task/type'
import type { Dictionary } from '@/components/internationalization/types'
import { logger } from '@/lib/logger'

const log = logger.forModule('task.page-client')

interface TaskPageClientProps {
  dictionary: Dictionary
}

export function TaskPageClient({ dictionary }: TaskPageClientProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const router = useRouter()

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const result = await getTasks()

      if (result.error) {
        log.error('Failed to fetch tasks', undefined, { reason: result.error })
        toast.error(dictionary?.task?.fetchError ?? "")
        return
      }

      setTasks(result.tasks || [])
    } catch (error) {
      log.error('Exception in fetchTasks', error as Error)
      toast.error(dictionary?.task?.fetchError ?? "")
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  const columns = getColumns(fetchTasks, dictionary)

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleRowClick = (task: Task, event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    const actionButton = target.closest('[data-action="no-navigate"]')

    if (actionButton) {
      return
    }

    const taskId = task.id || task._id
    router.push(`/task/${taskId}`)
  }

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      const result = await syncProjectsWithTasks()

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(result.message || (dictionary?.task?.syncCompleted ?? ""))

      // Refresh tasks after sync
      await fetchTasks()
    } catch (error) {
      log.error('Sync error', error as Error)
      toast.error(dictionary?.task?.syncError ?? "")
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 me-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? (dictionary?.task?.syncing ?? "") : (dictionary?.task?.syncWithProjects ?? "")}
        </Button>
      </div>
      <Content
        columns={columns}
        data={tasks}
        onTasksChange={fetchTasks}
        onRowClick={handleRowClick}
      />
    </div>
  )
}
