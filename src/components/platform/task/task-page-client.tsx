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
        console.error('Failed to fetch tasks:', result.error)
        toast.error(dictionary?.task?.fetchError ?? 'Failed to fetch tasks')
        return
      }

      setTasks(result.tasks || [])
    } catch (error) {
      console.error('Exception in fetchTasks:', error)
      toast.error(dictionary?.task?.fetchError ?? 'Failed to fetch tasks')
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

      toast.success(result.message || (dictionary?.task?.syncCompleted ?? 'Sync completed'))

      // Refresh tasks after sync
      await fetchTasks()
    } catch (error) {
      console.error('Sync error:', error)
      toast.error(dictionary?.task?.syncError ?? 'Failed to sync projects with tasks')
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
          {isSyncing ? (dictionary?.task?.syncing ?? 'Syncing...') : (dictionary?.task?.syncWithProjects ?? 'Sync with Projects')}
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
