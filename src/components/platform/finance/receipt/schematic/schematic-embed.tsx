/**
 * Schematic Embed Component (Stubbed)
 *
 * TODO: Install @schematichq/schematic-components for subscription management UI
 * This stub allows the build to pass without the Schematic dependencies
 */

"use client"

import React from "react"

function SchematicEmbed({
  accessToken,
  componentId,
}: {
  accessToken: string
  componentId: string
}) {
  return (
    <div className="rounded-lg border p-6 text-center">
      <p className="text-muted-foreground text-sm">
        Subscription management component
      </p>
      <p className="text-muted-foreground mt-2 text-xs">
        Install @schematichq/schematic-components to enable this feature
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        Component ID: {componentId}
      </p>
    </div>
  )
}

export default SchematicEmbed
