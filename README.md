# MCP Mattermost Server

This is an MCP (Model Context Protocol) server for Mattermost, written in TypeScript. It provides various tools for interacting with the Mattermost API.

## Installation

To run this tool, you need to set the following environment variables:

```json
{
  ...
  "mcp-mattermost": {
    "command": "npx",
    "args": [
      "@dakatan/mcp-mattermost"
    ],
    "env": {
      "MCP_MATTERMOST_URL": "https://mattermost.x.y",
      "MCP_MATTERMOST_TOKEN": "<personal access token or bot token>",
      "MCP_MATTERMOST_TEAM_ID": "",
      "MCP_MATTERMOST_TEAM_NAME": ""
    }
  },
  ...
}
```

## Configuration

| Variable Name              | Description                                                                         | Required |
| -------------------------- | ----------------------------------------------------------------------------------- | -------- |
| `MCP_MATTERMOST_URL`       | The URL of your Mattermost instance                                                 | Yes      |
| `MCP_MATTERMOST_TOKEN`     | Your Mattermost personal access token or bot token                                  | Yes      |
| `MCP_MATTERMOST_TEAM_ID`   | Team ID(s) — single value or comma-separated list (e.g. `id1,id2`)                  | No       |
| `MCP_MATTERMOST_TEAM_NAME` | Team name(s) — single value or comma-separated list (e.g. `team-a,team-b`)          | No       |

### Team configuration

- **Single team**: provide a single `MCP_MATTERMOST_TEAM_ID` or `MCP_MATTERMOST_TEAM_NAME`
- **Multiple teams**: provide a comma-separated list, e.g. `MCP_MATTERMOST_TEAM_ID=id1,id2,id3`
- **Auto-discover**: if neither variable is set, the server will automatically discover all teams the user/bot belongs to via the `getMyTeams()` API

Both `MCP_MATTERMOST_TEAM_ID` and `MCP_MATTERMOST_TEAM_NAME` can be set simultaneously — teams from both will be combined.

**Note:** Using `MCP_MATTERMOST_TEAM_ID` is recommended as it's more reliable and efficient than using team names.

### Bot token support

Bot tokens in Mattermost work identically to personal access tokens — both use `Authorization: BEARER <token>`. Simply set `MCP_MATTERMOST_TOKEN` to your bot token value.

## Tools Provided

The MCP server provides the following tools:

- User management: `mattermost_get_users`, `mattermost_search_users`
- Channel management: `mattermost_search_channels`, `mattermost_get_channels`, `mattermost_get_my_channels`
- Post management: `mattermost_search_posts`, `mattermost_get_posts`, `mattermost_get_channel_posts`, `mattermost_create_post`, `mattermost_get_posts_thread`, `mattermost_pin_post`, `mattermost_unpin_post`, `mattermost_get_pinned_posts`
- Reaction management: `mattermost_add_reaction`, `mattermost_remove_reaction`, `mattermost_get_reactions`
