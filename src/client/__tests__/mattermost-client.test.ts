import { MattermostConfig } from '../../config/config';
import { MattermostClient } from '../mattermost-client';

jest.mock('@mattermost/client', () => ({
  Client4: jest.fn().mockImplementation(() => ({
    setUrl: jest.fn(),
    setToken: jest.fn(),
    getTeam: jest.fn().mockResolvedValue({ id: 'test-team-id', name: 'test-team-name' }),
    getTeamByName: jest.fn().mockResolvedValue({ id: 'test-team-id', name: 'test-team-name' }),
    getMyTeams: jest
      .fn()
      .mockResolvedValue([
        { id: 'auto-team-1', name: 'auto-team-1' },
        { id: 'auto-team-2', name: 'auto-team-2' },
      ]),
    getMe: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
    getUser: jest.fn().mockResolvedValue({ id: 'test-user-id', username: 'test-user' }),
    searchUsers: jest.fn().mockResolvedValue([{ id: 'test-user-id', username: 'test-user' }]),
    searchAllChannels: jest
      .fn()
      .mockResolvedValue([{ id: 'test-channel-id', name: 'test-channel' }]),
    getChannel: jest.fn().mockResolvedValue({ id: 'test-channel-id', name: 'test-channel' }),
    getChannelByName: jest.fn().mockResolvedValue({ id: 'test-channel-id', name: 'test-channel' }),
    searchPostsWithParams: jest.fn().mockResolvedValue({
      posts: {
        'test-post-id': {
          id: 'test-post-id',
          message: 'test-post',
          create_at: 123456789,
          update_at: 123456789,
          edit_at: 0,
          delete_at: 0,
        },
      },
      order: ['test-post-id'],
    }),
    getPost: jest.fn().mockResolvedValue({
      id: 'test-post-id',
      message: 'test-post',
      create_at: 123456789,
      update_at: 123456789,
      edit_at: 0,
      delete_at: 0,
    }),
    getPosts: jest.fn().mockResolvedValue({
      posts: {
        'test-post-id': {
          id: 'test-post-id',
          message: 'test-post',
          create_at: 123456789,
          update_at: 123456789,
          edit_at: 0,
          delete_at: 0,
        },
      },
      order: ['test-post-id'],
    }),
    getPostsUnread: jest.fn().mockResolvedValue({
      posts: {
        'test-post-id': {
          id: 'test-post-id',
          message: 'test-post',
          create_at: 123456789,
          update_at: 123456789,
          edit_at: 0,
          delete_at: 0,
        },
      },
      order: ['test-post-id'],
    }),
    createPost: jest.fn().mockResolvedValue({
      id: 'new-post-id',
      message: 'new-post',
      create_at: 123456789,
      update_at: 123456789,
      edit_at: 0,
      delete_at: 0,
    }),
    getPaginatedPostThread: jest.fn().mockResolvedValue({
      posts: {
        'test-post-id': {
          id: 'test-post-id',
          message: 'test-post',
          create_at: 123456789,
          update_at: 123456789,
          edit_at: 0,
          delete_at: 0,
        },
      },
      order: ['test-post-id'],
    }),
    addReaction: jest.fn().mockResolvedValue({}),
    removeReaction: jest.fn().mockResolvedValue({}),
    getReactionsForPost: jest
      .fn()
      .mockResolvedValue([{ user_id: 'test-user-id', emoji_name: 'test-emoji' }]),
    pinPost: jest.fn().mockResolvedValue({}),
    unpinPost: jest.fn().mockResolvedValue({}),
    getPinnedPosts: jest.fn().mockResolvedValue({
      posts: {
        'test-post-id': {
          id: 'test-post-id',
          message: 'test-post',
          create_at: 123456789,
          update_at: 123456789,
          edit_at: 0,
          delete_at: 0,
        },
      },
      order: ['test-post-id'],
    }),
    getMyChannels: jest.fn().mockResolvedValue([
      { id: 'test-channel-id', name: 'test-channel', type: 'O' },
    ]),
  })),
}));

describe('MattermostClient', () => {
  describe('team name configuration', () => {
    const config: MattermostConfig = {
      url: 'https://example.com',
      token: 'test-token',
      teamNames: ['test-team-name'],
    };

    const client = new MattermostClient(config);
    beforeEach(async () => {
      await client.init();
    });

    it('should create a client with valid config', () => {
      expect(client).toBeInstanceOf(MattermostClient);
    });

    it('should get the current user', async () => {
      const result = await client.getMe();
      expect(result).toEqual({
        id: 'test-user-id',
        create_at: expect.any(Date),
        update_at: expect.any(Date),
        delete_at: expect.any(Date),
      });
    });

    it('should get a user by ID', async () => {
      const result = await client.getUser({ userId: 'test-user-id' });
      expect(result).toEqual({
        id: 'test-user-id',
        username: 'test-user',
        create_at: expect.any(Date),
        update_at: expect.any(Date),
        delete_at: expect.any(Date),
      });
    });

    it('should search users', async () => {
      const result = await client.searchUsers({ term: 'test' });
      expect(result).toEqual([
        {
          id: 'test-user-id',
          username: 'test-user',
          create_at: expect.any(Date),
          update_at: expect.any(Date),
          delete_at: expect.any(Date),
        },
      ]);
    });

    it('should search channels', async () => {
      const result = await client.searchChannels({ term: 'test' });
      expect(result).toEqual([{ id: 'test-channel-id', name: 'test-channel' }]);
    });

    it('should get a channel by ID', async () => {
      const result = await client.getChannel({ channelId: 'test-channel-id' });
      expect(result).toEqual({
        id: 'test-channel-id',
        name: 'test-channel',
        create_at: expect.any(Date),
        update_at: expect.any(Date),
        delete_at: expect.any(Date),
      });
    });

    it('should get a channel by name', async () => {
      const result = await client.getChannelByName({ name: 'test-channel' });
      expect(result).toEqual({
        id: 'test-channel-id',
        name: 'test-channel',
        create_at: expect.any(Date),
        update_at: expect.any(Date),
        delete_at: expect.any(Date),
      });
    });

    it('should search posts', async () => {
      const result = await client.searchPosts({ terms: 'test' });
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });

    it('should get a post by ID', async () => {
      const result = await client.getPost({ postId: 'test-post-id' });
      expect(result).toEqual({
        id: 'test-post-id',
        message: 'test-post',
        create_at: new Date(123456789),
        update_at: new Date(123456789),
        edit_at: '',
        delete_at: '',
      });
    });

    it('should create a new post', async () => {
      const result = await client.createPost({ channelId: 'test-channel-id', message: 'new-post' });
      expect(result).toEqual({
        id: 'new-post-id',
        message: 'new-post',
        create_at: new Date(123456789),
        update_at: new Date(123456789),
        edit_at: '',
        delete_at: '',
      });
    });

    it('should get recent posts in a channel', async () => {
      const result = await client.getPostsForChannel({ channelId: 'test-channel-id' });
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });

    it('should get recent posts in a channel with pagination', async () => {
      const result = await client.getPostsForChannel({
        channelId: 'test-channel-id',
        page: 1,
        perPage: 10,
      });
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });

    it('should get unread posts in a channel', async () => {
      const result = await client.getPostsUnread({ channelId: 'test-channel-id' });
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });

    it('should get posts in a thread', async () => {
      const result = await client.getPostsThread({ rootId: 'test-post-id' });
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });

    it('should add a reaction to a post', async () => {
      const result = await client.addReaction({ postId: 'test-post-id', emojiName: 'test-emoji' });
      expect(result).toEqual({
        create_at: expect.any(Date),
      });
    });

    it('should remove a reaction from a post', async () => {
      const result = await client.removeReaction({
        postId: 'test-post-id',
        emojiName: 'test-emoji',
      });
      expect(result).toEqual({});
    });

    it('should pin a post', async () => {
      const result = await client.pinPost({ postId: 'test-post-id' });
      expect(result).toEqual({});
    });

    it('should unpin a post', async () => {
      const result = await client.unpinPost({ postId: 'test-post-id' });
      expect(result).toEqual({});
    });

    it('should get pinned posts in a channel', async () => {
      const result = await client.getPinnedPosts({ channelId: 'test-channel-id' });
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });

    it('should get my channels', async () => {
      const result = await client.getMyChannels();
      expect(result).toEqual([
        {
          id: 'test-channel-id',
          name: 'test-channel',
          type: 'O',
          create_at: expect.any(Date),
          update_at: expect.any(Date),
          delete_at: expect.any(Date),
        },
      ]);
    });
  });

  describe('team ID configuration', () => {
    const config: MattermostConfig = {
      url: 'https://example.com',
      token: 'test-token',
      teamIds: ['test-team-id'],
    };

    const client = new MattermostClient(config);
    beforeEach(async () => {
      await client.init();
    });

    it('should create a client with valid config', () => {
      expect(client).toBeInstanceOf(MattermostClient);
    });

    it('should get the current user', async () => {
      const result = await client.getMe();
      expect(result).toEqual({
        id: 'test-user-id',
        create_at: expect.any(Date),
        update_at: expect.any(Date),
        delete_at: expect.any(Date),
      });
    });
  });

  describe('auto-discover configuration (no teams specified)', () => {
    const config: MattermostConfig = {
      url: 'https://example.com',
      token: 'test-token',
    };

    const client = new MattermostClient(config);
    beforeEach(async () => {
      await client.init();
    });

    it('should create a client with valid config', () => {
      expect(client).toBeInstanceOf(MattermostClient);
    });

    it('should get the current user', async () => {
      const result = await client.getMe();
      expect(result).toEqual({
        id: 'test-user-id',
        create_at: expect.any(Date),
        update_at: expect.any(Date),
        delete_at: expect.any(Date),
      });
    });

    it('should search channels across auto-discovered teams', async () => {
      const result = await client.searchChannels({ term: 'test' });
      expect(result).toEqual([{ id: 'test-channel-id', name: 'test-channel' }]);
    });
  });

  describe('multiple teams configuration', () => {
    const config: MattermostConfig = {
      url: 'https://example.com',
      token: 'test-token',
      teamIds: ['team-id-1', 'team-id-2'],
    };

    const client = new MattermostClient(config);
    beforeEach(async () => {
      await client.init();
    });

    it('should create a client with valid config', () => {
      expect(client).toBeInstanceOf(MattermostClient);
    });

    it('should search posts across multiple teams', async () => {
      const result = await client.searchPosts({ terms: 'test' });
      // Results from both teams are merged, but since mock returns same post,
      // deduplication keeps only one
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });
  });

  // Common tests using team name configuration
  describe('common functionality', () => {
    const config: MattermostConfig = {
      url: 'https://example.com',
      token: 'test-token',
      teamNames: ['test-team-name'],
    };

    const client = new MattermostClient(config);
    beforeEach(async () => {
      await client.init();
    });

    it('should get the current user', async () => {
      const result = await client.getMe();
      expect(result).toEqual({
        id: 'test-user-id',
        create_at: expect.any(Date),
        update_at: expect.any(Date),
        delete_at: expect.any(Date),
      });
    });

    it('should get a user by ID', async () => {
      const result = await client.getUser({ userId: 'test-user-id' });
      expect(result).toEqual({
        id: 'test-user-id',
        username: 'test-user',
        create_at: expect.any(Date),
        update_at: expect.any(Date),
        delete_at: expect.any(Date),
      });
    });

    it('should search users', async () => {
      const result = await client.searchUsers({ term: 'test' });
      expect(result).toEqual([
        {
          id: 'test-user-id',
          username: 'test-user',
          create_at: expect.any(Date),
          update_at: expect.any(Date),
          delete_at: expect.any(Date),
        },
      ]);
    });

    it('should search channels', async () => {
      const result = await client.searchChannels({ term: 'test' });
      expect(result).toEqual([{ id: 'test-channel-id', name: 'test-channel' }]);
    });

    it('should get a channel by ID', async () => {
      const result = await client.getChannel({ channelId: 'test-channel-id' });
      expect(result).toEqual({
        id: 'test-channel-id',
        name: 'test-channel',
        create_at: expect.any(Date),
        update_at: expect.any(Date),
        delete_at: expect.any(Date),
      });
    });

    it('should get a channel by name', async () => {
      const result = await client.getChannelByName({ name: 'test-channel' });
      expect(result).toEqual({
        id: 'test-channel-id',
        name: 'test-channel',
        create_at: expect.any(Date),
        update_at: expect.any(Date),
        delete_at: expect.any(Date),
      });
    });

    it('should search posts', async () => {
      const result = await client.searchPosts({ terms: 'test' });
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });

    it('should get a post by ID', async () => {
      const result = await client.getPost({ postId: 'test-post-id' });
      expect(result).toEqual({
        id: 'test-post-id',
        message: 'test-post',
        create_at: new Date(123456789),
        update_at: new Date(123456789),
        edit_at: '',
        delete_at: '',
      });
    });

    it('should create a new post', async () => {
      const result = await client.createPost({ channelId: 'test-channel-id', message: 'new-post' });
      expect(result).toEqual({
        id: 'new-post-id',
        message: 'new-post',
        create_at: new Date(123456789),
        update_at: new Date(123456789),
        edit_at: '',
        delete_at: '',
      });
    });

    it('should get recent posts in a channel', async () => {
      const result = await client.getPostsForChannel({ channelId: 'test-channel-id' });
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });

    it('should get unread posts in a channel', async () => {
      const result = await client.getPostsUnread({ channelId: 'test-channel-id' });
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });

    it('should get posts in a thread', async () => {
      const result = await client.getPostsThread({ rootId: 'test-post-id' });
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });

    it('should add a reaction to a post', async () => {
      const result = await client.addReaction({ postId: 'test-post-id', emojiName: 'test-emoji' });
      expect(result).toEqual({
        create_at: expect.any(Date),
      });
    });

    it('should remove a reaction from a post', async () => {
      const result = await client.removeReaction({
        postId: 'test-post-id',
        emojiName: 'test-emoji',
      });
      expect(result).toEqual({});
    });

    it('should pin a post', async () => {
      const result = await client.pinPost({ postId: 'test-post-id' });
      expect(result).toEqual({});
    });

    it('should unpin a post', async () => {
      const result = await client.unpinPost({ postId: 'test-post-id' });
      expect(result).toEqual({});
    });

    it('should get pinned posts in a channel', async () => {
      const result = await client.getPinnedPosts({ channelId: 'test-channel-id' });
      expect(result).toEqual({
        order: ['test-post-id'],
        posts: {
          'test-post-id': {
            id: 'test-post-id',
            message: 'test-post',
            create_at: new Date(123456789),
            update_at: new Date(123456789),
            edit_at: '',
            delete_at: '',
          },
        },
      });
    });
  });
});
