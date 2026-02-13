import { z } from 'zod';

import { AbstractHandler } from './handler';

/**
 * Handler for post-related MCP tools
 */
export class HandlerPost extends AbstractHandler {
  /**
   * Search posts by term
   */
  private async searchPosts({
    terms,
    page = 0,
    perPage = 100,
  }: {
    terms: string;
    page?: number;
    perPage?: number;
  }) {
    return this.client.searchPosts({ terms, page, perPage });
  }

  /**
   * Get posts by ID
   */
  private async getPosts({ postId }: { postId: string[] }) {
    return Promise.all(postId.map(v => this.client.getPost({ postId: v })));
  }

  /**
   * Get recent posts in a channel
   */
  private async getPostsForChannel({
    channelId,
    page,
    perPage,
  }: {
    channelId: string;
    page?: number;
    perPage?: number;
  }) {
    return this.client.getPostsForChannel({ channelId, page, perPage });
  }

  /**
   * Get unread posts in a channel
   */
  private async getPostsUnread({ channelId }: { channelId: string }) {
    return this.client.getPostsUnread({ channelId });
  }

  /**
   * Create a new post
   */
  private async createPost({
    channelId,
    message,
    rootId,
  }: {
    channelId: string;
    message: string;
    rootId?: string;
  }) {
    return this.client.createPost({ channelId, message, rootId });
  }

  /**
   * Get posts in a thread
   */
  private async getPostsThread({
    rootId,
    fromPost,
    perPage,
  }: {
    rootId: string;
    perPage?: number;
    fromPost?: string;
  }) {
    return this.client.getPostsThread({ rootId, fromPost, perPage });
  }

  /**
   * Pin a post to a channel
   */
  private async pinPost({ postId }: { postId: string }) {
    return this.client.pinPost({ postId });
  }

  /**
   * Unpin a post from a channel
   */
  private async unpinPost({ postId }: { postId: string }) {
    return this.client.unpinPost({ postId });
  }

  /**
   * Get pinned posts in a channel
   */
  private async getPinnedPosts({ channelId }: { channelId: string }) {
    return this.client.getPinnedPosts({ channelId });
  }

  /**
   * Get the MCP tools provided by this handler
   */
  getMcpTools() {
    return [
      this.createMcpTool({
        name: 'mattermost_search_posts',
        description:
          'Search posts by term with support for advanced search modifiers. Without any modifiers, performs a general search across all accessible content. Supported modifiers include:\n\n- `from:username` - Find posts from specific users\n- `in:channel` - Find posts in specific channels (by name or ID)\n- `before:YYYY-MM-DD` - Find posts before a date\n- `after:YYYY-MM-DD` - Find posts after a date\n- `on:YYYY-MM-DD` - Find posts on a specific date\n- `-term` - Exclude posts containing the term\n- `"exact phrase"` - Search for exact phrases using quotes\n- `term*` - Wildcard search (asterisk at end only)\n- `#hashtag` - Search for hashtags\n\nModifiers can be combined. Example: `meeting in:town-square from:john after:2023-01-01`',
        parameter: {
          terms: z
            .string()
            .describe(
              'Search term with optional modifiers. Without modifiers, performs a general search.',
            ),
          page: z.number().optional().describe('Page number'),
          perPage: z.number().optional().describe('Number of posts per page'),
        },
        handler: async ({
          terms,
          page,
          perPage,
        }: {
          terms: string;
          page?: number;
          perPage?: number;
        }) => {
          return this.searchPosts({ terms, page, perPage });
        },
      }),
      this.createMcpTool({
        name: 'mattermost_get_posts',
        description: 'Get posts by post ID',
        parameter: {
          postId: z.string().describe('Post ID').describe('Comma splitted array of post ID'),
        },
        handler: async ({ postId }: { postId: string }) => {
          return this.getPosts({ postId: postId.split(',').map(v => v.trim()) });
        },
      }),
      this.createMcpTool({
        name: 'mattermost_get_channel_posts',
        description:
          'Get recent posts in a channel. Returns posts in reverse chronological order (newest first). Use page and perPage parameters for pagination.',
        parameter: {
          channelId: z.string().describe('Channel ID to get posts from'),
          page: z.number().optional().describe('Page number (0-based, default: 0)'),
          perPage: z
            .number()
            .optional()
            .describe('Number of posts per page (default: 30, max: 200)'),
        },
        handler: async ({
          channelId,
          page,
          perPage,
        }: {
          channelId: string;
          page?: number;
          perPage?: number;
        }) => {
          return this.getPostsForChannel({ channelId, page, perPage });
        },
      }),
      this.createMcpTool({
        name: 'mattermost_get_posts_unread',
        description: 'Get unread posts in a channel for the current user',
        parameter: {
          channelId: z.string().describe('Channel ID to get unread posts from'),
        },
        handler: async ({ channelId }: { channelId: string }) => {
          return this.getPostsUnread({ channelId });
        },
      }),
      this.createMcpTool({
        name: 'mattermost_create_post',
        description: 'Create a new post in a channel',
        parameter: {
          channelId: z.string().describe('Channel ID'),
          message: z.string().describe('Message content'),
          rootId: z.string().optional().describe('Post ID to reply to'),
        },
        handler: async ({
          channelId,
          message,
          rootId,
        }: {
          channelId: string;
          message: string;
          rootId?: string;
        }) => {
          return this.createPost({ channelId, message, rootId });
        },
      }),
      this.createMcpTool({
        name: 'mattermost_get_posts_thread',
        description: 'Get all posts in a thread',
        parameter: {
          rootId: z.string().describe('Post ID of the thread parent'),
          perPage: z.number().optional().describe('Number of posts per page'),
          fromPost: z.string().optional().describe('Post ID to start from'),
        },
        handler: async ({
          rootId,
          fromPost,
          perPage,
        }: {
          rootId: string;
          perPage?: number;
          fromPost?: string;
        }) => {
          return this.getPostsThread({ rootId, fromPost, perPage });
        },
      }),
      this.createMcpTool({
        name: 'mattermost_pin_post',
        description: 'Pin a post to a channel',
        parameter: { postId: z.string().describe('Post ID to pin') },
        handler: async ({ postId }: { postId: string }) => {
          return this.pinPost({ postId });
        },
      }),
      this.createMcpTool({
        name: 'mattermost_unpin_post',
        description: 'Unpin a post from a channel',
        parameter: { postId: z.string().describe('Post ID to unpin') },
        handler: async ({ postId }: { postId: string }) => {
          return this.unpinPost({ postId });
        },
      }),
      this.createMcpTool({
        name: 'mattermost_get_pinned_posts',
        description: 'Get all pinned posts in a channel',
        parameter: { channelId: z.string().describe('Channel ID to get pinned posts from') },
        handler: async ({ channelId }: { channelId: string }) => {
          return this.getPinnedPosts({ channelId });
        },
      }),
    ];
  }
}
