import { faker } from "@faker-js/faker"
import type { Task, TaskPriority, TaskStatus } from "@prisma/client"
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircle2,
  CircleHelp,
  CircleIcon,
  CircleX,
  Timer,
} from "lucide-react"
import { customAlphabet } from "nanoid"

export function generateRandomTask(): Omit<Task, "id"> {
  const statusValues: TaskStatus[] = ["PENDING", "STUCK", "IN_PROGRESS", "DONE"]
  const priorityValues: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"]

  return {
    task: faker.hacker
      .phrase()
      .replace(/^./, (letter) => letter.toUpperCase()),
    project: "Default Project",
    status: faker.helpers.shuffle(statusValues)[0] ?? "PENDING",
    priority: faker.helpers.shuffle(priorityValues)[0] ?? "MEDIUM",
    desc: null,
    label: null,
    duration: null,
    assignedTo: [],
    date: null,
    hours: null,
    projectId: null,
    userId: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function getStatusIcon(status: Task["status"]) {
  const statusIcons = {
    STUCK: CircleX,
    DONE: CheckCircle2,
    IN_PROGRESS: Timer,
    PENDING: CircleHelp,
  }

  return statusIcons[status] || CircleIcon
}

export function getPriorityIcon(priority: Task["priority"] | "LOW" | "MEDIUM" | "HIGH" | "URGENT") {
  const priorityIcons: Record<string, typeof ArrowUpIcon> = {
    URGENT: ArrowUpIcon,
    HIGH: ArrowUpIcon,
    LOW: ArrowDownIcon,
    MEDIUM: ArrowRightIcon,
  }

  return priorityIcons[priority] || CircleIcon
}
