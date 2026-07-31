import { loadConfig, type AppConfig } from '@forjadata/config'

export type { AppConfig } from '@forjadata/config'

export function readConfig(
  environment: Record<string, string | undefined> = process.env,
): AppConfig {
  return loadConfig(environment)
}
