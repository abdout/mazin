export const TASK_STATUS = {
  PENDING: "pending",
  STUCK: "stuck",
  IN_PROGRESS: "in_progress",
  DONE: "done"
} as const;

export const TASK_PRIORITY = {
  URGENT: "urgent",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
} as const;

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.PENDING]: "Pending",
  [TASK_STATUS.STUCK]: "Stuck",
  [TASK_STATUS.IN_PROGRESS]: "In Progress",
  [TASK_STATUS.DONE]: "Done"
};

export const TASK_PRIORITY_LABELS = {
  [TASK_PRIORITY.URGENT]: "Urgent",
  [TASK_PRIORITY.HIGH]: "High",
  [TASK_PRIORITY.MEDIUM]: "Medium",
  [TASK_PRIORITY.LOW]: "Low"
};

export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const TASK_PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({
  value,
  label
}));

// Task categories for custom clearance
export const TASK_CATEGORIES = {
  DOCUMENTATION: "Documentation",
  DECLARATION: "Declaration",
  INSPECTION: "Inspection",
  PAYMENT: "Payment",
  RELEASE: "Release",
  DELIVERY: "Delivery",
  GENERAL: "General"
} as const;

export const TASK_CATEGORY_OPTIONS = Object.entries(TASK_CATEGORIES).map(([key, label]) => ({
  value: key.toLowerCase(),
  label
}));
