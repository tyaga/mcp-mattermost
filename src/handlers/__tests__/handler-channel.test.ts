import { MattermostClient } from '../../client/mattermost-client';
import { HandlerChannel } from '../handler-channel';

jest.mock('../../client/mattermost-client', () => ({
  MattermostClient: jest.fn().mockImplementation(() => ({
    searchChannels: jest.fn().mockResolvedValue([{ id: 'test-channel-id', name: 'test-channel' }]),
    getChannel: jest.fn().mockResolvedValue({ id: 'test-channel-id', name: 'test-channel' }),
    getChannelByName: jest.fn().mockResolvedValue({ id: 'test-channel-id', name: 'test-channel' }),
    getMyChannels: jest.fn().mockResolvedValue([{ id: 'test-channel-id', name: 'test-channel' }]),
  })),
}));

describe('HandlerChannel', () => {
  const client = new MattermostClient({
    url: 'http://localhost',
    token: 'test-token',
    teamNames: ['test-team-name'],
  });
  const handler = new HandlerChannel(client);

  it('should get MCP tools', () => {
    const tools = handler.getMcpTools();
    expect(tools).toHaveLength(3);
  });

  it('should search channels', async () => {
    const tools = handler.getMcpTools();
    const searchChannelsTool = tools.find(tool => tool.name === 'mattermost_search_channels');
    if (searchChannelsTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await searchChannelsTool.handler({ term: 'test' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_search_channels tool not found');
    }
  });

  it('should get channels by channel ID', async () => {
    const tools = handler.getMcpTools();
    const getChannelsTool = tools.find(tool => tool.name === 'mattermost_get_channels');
    if (getChannelsTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getChannelsTool.handler({ channelId: 'test-channel-id' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_get_channels tool not found');
    }
  });

  it('should get channels by name', async () => {
    const tools = handler.getMcpTools();
    const getChannelsTool = tools.find(tool => tool.name === 'mattermost_get_channels');
    if (getChannelsTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getChannelsTool.handler({ name: 'test-channel' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_get_channels tool not found');
    }
  });

  it('should get channels for the current user', async () => {
    const tools = handler.getMcpTools();
    const getMyChannelsTool = tools.find(tool => tool.name === 'mattermost_get_my_channels');
    if (getMyChannelsTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getMyChannelsTool.handler({} as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_get_my_channels tool not found');
    }
  });
});
