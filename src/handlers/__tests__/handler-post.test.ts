import { MattermostClient } from '../../client/mattermost-client';
import { HandlerPost } from '../handler-post';

jest.mock('../../client/mattermost-client', () => ({
  MattermostClient: jest.fn().mockImplementation(() => ({
    searchPosts: jest.fn().mockResolvedValue([{ id: 'test-post-id', message: 'test-post' }]),
    getPost: jest.fn().mockResolvedValue({ id: 'test-post-id', message: 'test-post' }),
    getPostsForChannel: jest
      .fn()
      .mockResolvedValue({ order: ['test-post-id'], posts: { 'test-post-id': { id: 'test-post-id', message: 'test-post' } } }),
    getPostsUnread: jest.fn().mockResolvedValue([{ id: 'test-post-id', message: 'test-post' }]),
    createPost: jest.fn().mockResolvedValue({ id: 'new-post-id', message: 'new-post' }),
    getPostsThread: jest.fn().mockResolvedValue([{ id: 'test-post-id', message: 'test-post' }]),
    pinPost: jest.fn().mockResolvedValue({}),
    unpinPost: jest.fn().mockResolvedValue({}),
    getPinnedPosts: jest.fn().mockResolvedValue([{ id: 'test-post-id', message: 'test-post' }]),
  })),
}));

describe('HandlerPost', () => {
  const client = new MattermostClient({
    url: 'https://example.com',
    token: 'test-token',
    teamNames: ['test-team-name'],
  });
  const handler = new HandlerPost(client);

  it('should get MCP tools', () => {
    const tools = handler.getMcpTools();
    expect(tools).toHaveLength(9);
  });

  it('should search posts', async () => {
    const tools = handler.getMcpTools();
    const searchPostsTool = tools.find(tool => tool.name === 'mattermost_search_posts');
    if (searchPostsTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await searchPostsTool.handler({ term: 'test' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_search_posts tool not found');
    }
  });

  it('should get posts by post ID', async () => {
    const tools = handler.getMcpTools();
    const getPostsTool = tools.find(tool => tool.name === 'mattermost_get_posts');
    if (getPostsTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getPostsTool.handler({ postId: 'test-post-id' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_get_posts tool not found');
    }
  });

  it('should get recent posts in a channel', async () => {
    const tools = handler.getMcpTools();
    const getChannelPostsTool = tools.find(tool => tool.name === 'mattermost_get_channel_posts');
    if (getChannelPostsTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getChannelPostsTool.handler({ channelId: 'test-channel-id' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_get_channel_posts tool not found');
    }
  });

  it('should get unread posts in a channel', async () => {
    const tools = handler.getMcpTools();
    const getPostsUnreadTool = tools.find(tool => tool.name === 'mattermost_get_posts_unread');
    if (getPostsUnreadTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getPostsUnreadTool.handler({ channelId: 'test-channel-id' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_get_posts_unread tool not found');
    }
  });

  it('should create a new post', async () => {
    const tools = handler.getMcpTools();
    const createPostTool = tools.find(tool => tool.name === 'mattermost_create_post');
    if (createPostTool) {
      const result = await createPostTool.handler({
        channelId: 'test-channel-id',
        message: 'new-post',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_create_post tool not found');
    }
  });

  it('should get posts in a thread', async () => {
    const tools = handler.getMcpTools();
    const getPostsThreadTool = tools.find(tool => tool.name === 'mattermost_get_posts_thread');
    if (getPostsThreadTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getPostsThreadTool.handler({ rootId: 'test-post-id' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_get_posts_thread tool not found');
    }
  });

  it('should pin a post', async () => {
    const tools = handler.getMcpTools();
    const pinPostTool = tools.find(tool => tool.name === 'mattermost_pin_post');
    if (pinPostTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await pinPostTool.handler({ postId: 'test-post-id' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_pin_post tool not found');
    }
  });

  it('should unpin a post', async () => {
    const tools = handler.getMcpTools();
    const unpinPostTool = tools.find(tool => tool.name === 'mattermost_unpin_post');
    if (unpinPostTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await unpinPostTool.handler({ postId: 'test-post-id' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_unpin_post tool not found');
    }
  });

  it('should get pinned posts in a channel', async () => {
    const tools = handler.getMcpTools();
    const getPinnedPostsTool = tools.find(tool => tool.name === 'mattermost_get_pinned_posts');
    if (getPinnedPostsTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getPinnedPostsTool.handler({ channelId: 'test-channel-id' } as any);
      expect(result.isError).toBe(false);
      expect(result.content).toBeInstanceOf(Array);
    } else {
      fail('mattermost_get_pinned_posts tool not found');
    }
  });
});
