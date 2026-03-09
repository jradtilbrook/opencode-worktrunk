import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode plugin for worktrunk status markers.
 *
 * Shows OpenCode session status in `wt list` output:
 * - 🤖 = OpenCode is working
 * - 💬 = OpenCode is waiting for input
 *
 * Requires worktrunk (https://github.com/max-sixty/worktrunk) to be installed.
 */
export const WorktrunkPlugin: Plugin = async ({ $ }) => {
  // Track if we've set a marker (to avoid unnecessary clears on startup)
  let markerSet = false

  return {
    event: async ({ event }) => {
      try {
        // Session is actively running (AI working)
        if (event.type === "session.status") {
          const properties = (event as { properties?: { status?: string } })
            .properties
          if (
            properties?.status === "running" ||
            properties?.status === "busy"
          ) {
            await $`wt config state marker set 🤖 > /dev/null 2>&1 || true`
            markerSet = true
          }
        }

        // Session is idle (waiting for user input)
        if (event.type === "session.idle") {
          await $`wt config state marker set 💬 > /dev/null 2>&1 || true`
          markerSet = true
        }

        // Session ended - clear the marker
        if (event.type === "session.deleted") {
          if (markerSet) {
            await $`wt config state marker clear > /dev/null 2>&1 || true`
            markerSet = false
          }
        }
      } catch {
        // Silently ignore errors (wt might not be installed or not in a git repo)
      }
    },
  }
}
