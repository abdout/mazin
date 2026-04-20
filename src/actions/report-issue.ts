"use server"

import { auth } from "@/auth"

interface ReportData {
  description: string
  pageUrl: string
  category?: string
  viewport?: string
  direction?: string
  browser?: string
}

export async function reportIssue(data: ReportData) {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  const repo = process.env.GITHUB_REPO || "databayt/mazin"
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  }

  if (!token) throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN not configured")

  const prefix =
    data.category && data.category !== "other" ? `[${data.category}] ` : ""
  const desc = data.description
  const maxLen = 80 - prefix.length
  const truncated =
    desc.length > maxLen ? desc.slice(0, maxLen - 3) + "..." : desc
  const title = prefix + truncated

  const session = await auth().catch(() => null)
  const reporter = session?.user
    ? `${session.user.name} (${session.user.email})`
    : "Anonymous"

  const metadata = [
    `**Page**: \`${data.pageUrl}\``,
    `**Reporter**: ${reporter}`,
    `**Time**: ${new Date().toISOString()}`,
    data.category ? `**Category**: ${data.category}` : null,
    data.viewport ? `**Viewport**: ${data.viewport}` : null,
    data.direction ? `**Direction**: ${data.direction}` : null,
    data.browser ? `**Browser**: ${data.browser}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const body = [data.description, "", "---", "", metadata].join("\n")

  const payload: Record<string, unknown> = { title, body, labels: ["report"] }

  let response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  if (response.status === 422) {
    await fetch(`https://api.github.com/repos/${repo}/labels`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "report",
        color: "d93f0b",
        description: "User-reported issues",
      }),
    }).catch(() => {})

    response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    console.error(`[report-issue] GitHub API ${response.status}: ${text}`)
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const issueData = await response.json().catch(() => null)
  if (issueData?.comments_url) {
    fetch(issueData.comments_url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        body: "Received. This report is queued for automated review and fix. You'll be notified here when resolved.",
      }),
    }).catch(() => {})
  }
}
