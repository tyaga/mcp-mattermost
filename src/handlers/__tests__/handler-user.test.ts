import { MattermostClient } from '../../client/mattermost-client';
import { HandlerUser } from '../handler-user';

jest.mock('../../client/mattermost-client', () => ({
  MattermostClient: jest.fn().mockImplementation(() => ({
    getUser: jest.fn().mockResolvedValue({ id: 'test-user-id', username: 'test-user' }),
    getUserByUsername: jest.fn().mockResolvedValue({ id: 'test-user-id', username: 'test-user' }),
    searchUsers: jest.fn().mockResolvedValue([{ id: 'test-user-id', username: 'test-user' }]),
  })),
}));

describe('HandlerUser', () => {
  const client = new MattermostClient({
    url: 'https://example.com',
    token: 'test-token',
    teamNames: ['test-team-name'],
  });
  const handler = new HandlerUser(client);

  it('should get MCP tools', () => {
    const tools = handler.getMcpTools();
    expect(tools).toHaveLength(2);
  });

  it('should get users by user ID', async () => {
    const tools = handler.getMcpTools();
    const getUsersTool = tools.find(tool => tool.name === 'mattermost_get_users');
    if (getUsersTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getUsersTool.handler({ userId: 'test-user-id' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_get_users tool not found');
    }
  });

  it('should get users by username', async () => {
    const tools = handler.getMcpTools();
    const getUsersTool = tools.find(tool => tool.name === 'mattermost_get_users');
    if (getUsersTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getUsersTool.handler({ username: 'test-user' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_get_users tool not found');
    }
  });

  it('should search users', async () => {
    const tools = handler.getMcpTools();
    const searchUsersTool = tools.find(tool => tool.name === 'mattermost_search_users');
    if (searchUsersTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await searchUsersTool.handler({ term: 'test' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_search_users tool not found');
    }
  });
});
