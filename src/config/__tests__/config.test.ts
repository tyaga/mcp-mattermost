import { loadConfig } from '../config';

describe('loadConfig', () => {
  beforeEach(() => {
    // Clear all environment variables before each test
    delete process.env.MCP_MATTERMOST_URL;
    delete process.env.MCP_MATTERMOST_TOKEN;
    delete process.env.MCP_MATTERMOST_TEAM_NAME;
    delete process.env.MCP_MATTERMOST_TEAM_ID;
  });

  it('should load config with a single team name', () => {
    process.env.MCP_MATTERMOST_URL = 'https://example.com';
    process.env.MCP_MATTERMOST_TOKEN = 'test-token';
    process.env.MCP_MATTERMOST_TEAM_NAME = 'test-team-name';

    const config = loadConfig();
    expect(config).toEqual({
      url: 'https://example.com',
      token: 'test-token',
      teamNames: ['test-team-name'],
      teamIds: undefined,
    });
  });

  it('should load config with a single team ID', () => {
    process.env.MCP_MATTERMOST_URL = 'https://example.com';
    process.env.MCP_MATTERMOST_TOKEN = 'test-token';
    process.env.MCP_MATTERMOST_TEAM_ID = 'test-team-id';

    const config = loadConfig();
    expect(config).toEqual({
      url: 'https://example.com',
      token: 'test-token',
      teamNames: undefined,
      teamIds: ['test-team-id'],
    });
  });

  it('should load config with multiple comma-separated team names', () => {
    process.env.MCP_MATTERMOST_URL = 'https://example.com';
    process.env.MCP_MATTERMOST_TOKEN = 'test-token';
    process.env.MCP_MATTERMOST_TEAM_NAME = 'team-a, team-b, team-c';

    const config = loadConfig();
    expect(config).toEqual({
      url: 'https://example.com',
      token: 'test-token',
      teamNames: ['team-a', 'team-b', 'team-c'],
      teamIds: undefined,
    });
  });

  it('should load config with multiple comma-separated team IDs', () => {
    process.env.MCP_MATTERMOST_URL = 'https://example.com';
    process.env.MCP_MATTERMOST_TOKEN = 'test-token';
    process.env.MCP_MATTERMOST_TEAM_ID = 'id1,id2,id3';

    const config = loadConfig();
    expect(config).toEqual({
      url: 'https://example.com',
      token: 'test-token',
      teamNames: undefined,
      teamIds: ['id1', 'id2', 'id3'],
    });
  });

  it('should load config with both team names and team IDs', () => {
    process.env.MCP_MATTERMOST_URL = 'https://example.com';
    process.env.MCP_MATTERMOST_TOKEN = 'test-token';
    process.env.MCP_MATTERMOST_TEAM_NAME = 'test-team-name';
    process.env.MCP_MATTERMOST_TEAM_ID = 'test-team-id';

    const config = loadConfig();
    expect(config).toEqual({
      url: 'https://example.com',
      token: 'test-token',
      teamNames: ['test-team-name'],
      teamIds: ['test-team-id'],
    });
  });

  it('should load config without team name or team ID (auto-discover mode)', () => {
    process.env.MCP_MATTERMOST_URL = 'https://example.com';
    process.env.MCP_MATTERMOST_TOKEN = 'test-token';

    const config = loadConfig();
    expect(config).toEqual({
      url: 'https://example.com',
      token: 'test-token',
      teamNames: undefined,
      teamIds: undefined,
    });
  });

  it('should throw an error for invalid URL', () => {
    process.env.MCP_MATTERMOST_URL = 'invalid-url';
    process.env.MCP_MATTERMOST_TOKEN = 'test-token';
    process.env.MCP_MATTERMOST_TEAM_NAME = 'test-team-name';

    expect(() => loadConfig()).toThrow();
  });

  it('should throw an error for missing token', () => {
    process.env.MCP_MATTERMOST_URL = 'https://example.com';
    process.env.MCP_MATTERMOST_TOKEN = '';
    process.env.MCP_MATTERMOST_TEAM_NAME = 'test-team-name';

    expect(() => loadConfig()).toThrow();
  });
});
