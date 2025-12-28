/**
 * Schematic Client (Stubbed)
 *
 * TODO: Install @schematichq/schematic-typescript-node for feature flags
 * This stub allows the build to pass without the Schematic dependencies
 */

// Stubbed client interface
interface StubSchematicClient {
  checkFlag: (flagKey: string, context: Record<string, unknown>) => Promise<boolean>
  identify: (context: Record<string, unknown>) => Promise<void>
}

// Stub implementation
export const schematicClient: StubSchematicClient = {
  checkFlag: async (flagKey: string, context: Record<string, unknown>) => {
    console.log("schematicClient.checkFlag called (stubbed):", { flagKey, context })
    return true // Return true for all feature flags in development
  },
  identify: async (context: Record<string, unknown>) => {
    console.log("schematicClient.identify called (stubbed):", { context })
  },
}
