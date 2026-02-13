import { z } from 'zod';

/**
 * Configuration schema for Mattermost MCP server
 * @typedef {Object} MattermostConfigSchema
 * @property {string} url - Mattermost instance URL
 * @property {string} token - Mattermost personal access token or bot token
 * @property {string[]} [teamNames] - Mattermost team names (comma-separated in MCP_MATTERMOST_TEAM_NAME env var)
 * @property {string[]} [teamIds] - Mattermost team IDs (comma-separated in MCP_MATTERMOST_TEAM_ID env var)
 * If neither teamNames nor teamIds is provided, all teams the user/bot belongs to will be used automatically.
 */
const configSchema = z.object({
  url: z.string().url('Invalid Mattermost URL (from MCP_MATTERMOST_URL env var)'),
  token: z.string().min(1, 'Mattermost token is required (from MCP_MATTERMOST_TOKEN env var)'),
  teamNames: z.array(z.string().min(1)).optional(),
  teamIds: z.array(z.string().min(1)).optional(),
});

export type MattermostConfig = z.infer<typeof configSchema>;

/**
 * Load configuration from environment variables
 * @returns Validated configuration object
 */
export function loadConfig(): MattermostConfig {
  const config = {
    url: process.env.MCP_MATTERMOST_URL || '',
    token: process.env.MCP_MATTERMOST_TOKEN || '',
    teamNames: process.env.MCP_MATTERMOST_TEAM_NAME
      ? process.env.MCP_MATTERMOST_TEAM_NAME.split(',').map(s => s.trim())
      : undefined,
    teamIds: process.env.MCP_MATTERMOST_TEAM_ID
      ? process.env.MCP_MATTERMOST_TEAM_ID.split(',').map(s => s.trim())
      : undefined,
  };

  return configSchema.parse(config);
}
