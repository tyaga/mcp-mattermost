import { MattermostClient } from '../../client/mattermost-client';
import { HandlerReaction } from '../handler-reaction';

jest.mock('../../client/mattermost-client', () => ({
  MattermostClient: jest.fn().mockImplementation(() => ({
    addReaction: jest.fn().mockResolvedValue({}),
    removeReaction: jest.fn().mockResolvedValue({}),
    getReactionsForPost: jest
      .fn()
      .mockResolvedValue([{ user_id: 'test-user-id', emoji_name: 'test-emoji' }]),
  })),
}));

describe('HandlerReaction', () => {
  const client = new MattermostClient({
    url: 'https://example.com',
    token: 'test-token',
    teamNames: ['test-team-name'],
  });
  const handler = new HandlerReaction(client);

  it('should get MCP tools', () => {
    const tools = handler.getMcpTools();
    expect(tools).toHaveLength(3);
  });

  it('should add a reaction to a post', async () => {
    const tools = handler.getMcpTools();
    const addReactionTool = tools.find(tool => tool.name === 'mattermost_add_reaction');
    if (addReactionTool) {
      const result = await addReactionTool.handler({
        postId: 'test-post-id',
        emojiName: 'test-emoji',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_add_reaction tool not found');
    }
  });

  it('should remove a reaction from a post', async () => {
    const tools = handler.getMcpTools();
    const removeReactionTool = tools.find(tool => tool.name === 'mattermost_remove_reaction');
    if (removeReactionTool) {
      const result = await removeReactionTool.handler({
        postId: 'test-post-id',
        emojiName: 'test-emoji',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_remove_reaction tool not found');
    }
  });

  it('should get reactions for a post', async () => {
    const tools = handler.getMcpTools();
    const getReactionsTool = tools.find(tool => tool.name === 'mattermost_get_reactions');
    if (getReactionsTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getReactionsTool.handler({ postId: 'test-post-id' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_get_reactions tool not found');
    }
  });
});
