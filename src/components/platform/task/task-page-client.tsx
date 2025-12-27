'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { getColumns } from '@/components/platform/task/column'
import { Content } from '@/components/platform/task/content'
import { getTasks } from '@/components/platform/task/actions'
import { Task } from '@/components/platform/task/type'

export function TaskPageClient() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const result = await getTasks()

      if (result.error) {
        console.error('Failed to fetch tasks:', result.error)
        toast.error('Failed to fetch tasks')
        return
      }

      setTasks(result.tasks || [])
    } catch (error) {
      console.error('Exception in fetchTasks:', error)
      toast.error('Failed to fetch tasks')
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  const columns = getColumns(fetchTasks)

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

  return (
    <Content
      columns={columns}
      data={tasks}
      onTasksChange={fetchTasks}
      onRowClick={handleRowClick}
    />
  )
}
