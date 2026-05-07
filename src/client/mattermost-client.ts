import { Client4, DEFAULT_LIMIT_AFTER } from '@mattermost/client';
import { Channel } from '@mattermost/types/channels';
import { Post, PostList } from '@mattermost/types/posts';
import { Reaction } from '@mattermost/types/reactions';
import { UserProfile } from '@mattermost/types/users';

import { MattermostConfig } from '../config/config';
import { logger } from '../utils/logger';

/**
 * Wrapper for the Mattermost Client4 API client
 * Provides typed methods for interacting with the Mattermost API
 * Supports multiple teams simultaneously
 */
export class MattermostClient {
  private readonly client: Client4;
  private teamIds: string[] = [];
  private readonly config: MattermostConfig;
  // Lazy cache for the current user. `me.id` does not change for the lifetime
  // of the bot/token, so it is safe to memoise across reaction/unread calls.
  private cachedMe: Promise<UserProfile> | null = null;

  /**
   * Create a new Mattermost client
   * @param config Mattermost configuration
   */
  constructor(config: MattermostConfig) {
    this.client = new Client4();
    this.client.setUrl(config.url);
    this.client.setToken(config.token);
    this.config = config;
  }

  async init() {
    const resolvedIds: string[] = [];

    // Validate provided teamIds in parallel
    if (this.config.teamIds && this.config.teamIds.length > 0) {
      const teams = await Promise.all(
        this.config.teamIds.map(async teamId => {
          const team = await this.client.getTeam(teamId);
          if (!team) {
            throw new Error(`Team with ID '${teamId}' not found or not accessible`);
          }
          return team;
        }),
      );
      resolvedIds.push(...teams.map(t => t.id));
    }

    // Resolve provided teamNames to IDs in parallel
    if (this.config.teamNames && this.config.teamNames.length > 0) {
      const teams = await Promise.all(
        this.config.teamNames.map(async teamName => {
          const team = await this.client.getTeamByName(teamName);
          if (!team) {
            throw new Error(`Team with name '${teamName}' not found or not accessible`);
          }
          return team;
        }),
      );
      resolvedIds.push(...teams.map(t => t.id));
    }

    // If nothing was provided, auto-discover all teams the user/bot belongs to
    if (resolvedIds.length === 0) {
      const myTeams = await this.client.getMyTeams();
      if (!myTeams || myTeams.length === 0) {
        throw new Error('No teams found for the current user/bot');
      }
      resolvedIds.push(...myTeams.map(t => t.id));
    }

    // Deduplicate team IDs (in case both teamIds and teamNames resolve to the same team)
    this.teamIds = [...new Set(resolvedIds)];
  }

  /**
   * Resolve the raw current-user profile, memoised across calls. On failure the
   * cache is cleared so the next call retries instead of returning a stuck
   * rejected promise.
   */
  private getMeRaw(): Promise<UserProfile> {
    if (!this.cachedMe) {
      this.cachedMe = this.client.getMe().catch(e => {
        this.cachedMe = null;
        throw e;
      });
    }
    return this.cachedMe;
  }

  /**
   * Get the current user
   */
  async getMe() {
    return this.convertUserProfile(await this.getMeRaw());
  }

  /**
   * Get a user by ID
   */
  async getUser({ userId }: { userId: string }) {
    return this.convertUserProfile(await this.client.getUser(userId));
  }

  /**
   * Get a user by username
   */
  async getUserByUsername({ username }: { username: string }) {
    return this.convertUserProfile(await this.client.getUserByUsername(username));
  }

  /**
   * Search users by term (global search, not limited to a single team)
   */
  async searchUsers({ term }: { term: string }) {
    const response = await this.client.searchUsers(term, {});
    return response.map(this.convertUserProfile);
  }

  /**
   * Search channels by term across all configured teams
   */
  async searchChannels({
    term,
    page = 0,
    perPage = 100,
  }: {
    term: string;
    page?: number;
    perPage?: number;
  }) {
    if (this.teamIds.length === 0) {
      throw new Error('No teams configured');
    }
    return this.client.searchAllChannels(term, {
      team_ids: this.teamIds,
      page,
      per_page: perPage,
    });
  }

  /**
   * Get a channel by ID
   */
  async getChannel({ channelId }: { channelId: string }) {
    return this.convertChannel(await this.client.getChannel(channelId));
  }

  /**
   * Get a channel by name (searches across all configured teams in parallel,
   * returns the first successful match instead of probing teams sequentially).
   */
  async getChannelByName({ name }: { name: string }) {
    if (this.teamIds.length === 0) {
      throw new Error('No teams configured');
    }
    try {
      const channel = await Promise.any(
        this.teamIds.map(teamId => this.client.getChannelByName(teamId, name)),
      );
      return this.convertChannel(channel);
    } catch {
      throw new Error(`Channel '${name}' not found in any configured team`);
    }
  }

  /**
   * Search posts by term across all configured teams
   */
  async searchPosts({
    terms,
    page = 0,
    perPage = 100,
  }: {
    terms: string;
    page?: number;
    perPage?: number;
  }) {
    if (this.teamIds.length === 0) {
      throw new Error('No teams configured');
    }
    const allResults = await Promise.all(
      this.teamIds.map(teamId =>
        this.client.searchPostsWithParams(teamId, {
          terms,
          page,
          per_page: perPage,
        }),
      ),
    );
    return this.mergePostLists(allResults);
  }

  /**
   * Get a post by ID
   */
  async getPost({ postId }: { postId: string }) {
    return this.convertPost(await this.client.getPost(postId));
  }

  /**
   * Get recent posts in a channel
   */
  async getPostsForChannel({
    channelId,
    page = 0,
    perPage = 30,
  }: {
    channelId: string;
    page?: number;
    perPage?: number;
  }) {
    return this.convertPostList(await this.client.getPosts(channelId, page, perPage));
  }

  /**
   * Get unread posts in a channel
   */
  async getPostsUnread({ channelId }: { channelId: string }) {
    const me = await this.getMeRaw();
    return this.convertPostList(
      await this.client.getPostsUnread(channelId, me.id, DEFAULT_LIMIT_AFTER, 0, true),
    );
  }

  /**
   * Create a new post
   */
  async createPost({
    channelId,
    message,
    rootId,
  }: {
    channelId: string;
    message: string;
    rootId?: string;
  }) {
    const postData = { channel_id: channelId, message, root_id: rootId };
    logger.debug('createPost request:', {
      url: this.config.url,
      postData: { channel_id: channelId, message, root_id: rootId },
    });
    try {
      const result = await this.client.createPost(postData);
      logger.debug('createPost success:', { postId: result.id });
      return this.convertPost(result);
    } catch (e) {
      logger.error('createPost failed:', {
        postData,
        error: `${e}`,
        errorDetails: typeof e === 'object' && e !== null ? {
          status_code: (e as Record<string, unknown>).status_code,
          server_error_id: (e as Record<string, unknown>).server_error_id,
          url: (e as Record<string, unknown>).url,
        } : undefined,
      });
      throw e;
    }
  }

  /**
   * Get posts in a thread
   */
  async getPostsThread({
    rootId,
    fromPost,
    perPage,
  }: {
    rootId: string;
    fromPost?: string;
    perPage?: number;
  }) {
    return this.convertPostList(
      await this.client.getPaginatedPostThread(rootId, {
        direction: 'up',
        fromPost,
        perPage,
      }),
    );
  }

  /**
   * Add a reaction to a post
   */
  async addReaction({ postId, emojiName }: { postId: string; emojiName: string }) {
    const me = await this.getMeRaw();
    return this.convertReaction(await this.client.addReaction(me.id, postId, emojiName));
  }

  /**
   * Remove a reaction from a post
   */
  async removeReaction({ postId, emojiName }: { postId: string; emojiName: string }) {
    const me = await this.getMeRaw();
    return this.client.removeReaction(me.id, postId, emojiName);
  }

  /**
   * Get reactions for a post
   */
  async getReactionsForPost({ postId }: { postId: string }) {
    const response = await this.client.getReactionsForPost(postId);
    return response.map(this.convertReaction);
  }

  /**
   * Pin a post to a channel
   */
  async pinPost({ postId }: { postId: string }) {
    return this.client.pinPost(postId);
  }

  /**
   * Unpin a post from a channel
   */
  async unpinPost({ postId }: { postId: string }) {
    return this.client.unpinPost(postId);
  }

  /**
   * Get pinned posts in a channel
   */
  async getPinnedPosts({ channelId }: { channelId: string }) {
    return this.convertPostList(await this.client.getPinnedPosts(channelId));
  }

  /**
   * Get channels for the current user across all configured teams
   */
  async getMyChannels() {
    if (this.teamIds.length === 0) {
      throw new Error('No teams configured');
    }
    const allChannels = await Promise.all(
      this.teamIds.map(teamId => this.client.getMyChannels(teamId)),
    );
    const merged = allChannels.flat();
    // Deduplicate by channel ID
    const unique = [...new Map(merged.map(ch => [ch.id, ch])).values()];
    return unique.filter(channel => ['O', 'P'].includes(channel.type)).map(this.convertChannel);
  }

  /**
   * Merge multiple PostList results into a single PostList, deduplicating by post ID
   */
  private mergePostLists(postLists: PostList[]) {
    const mergedPosts: Record<string, Post> = {};
    const orderSet = new Set<string>();

    for (const postList of postLists) {
      for (const postId of postList.order) {
        if (!orderSet.has(postId)) {
          orderSet.add(postId);
        }
        mergedPosts[postId] = postList.posts[postId];
      }
    }

    return this.convertPostList({
      order: [...orderSet],
      posts: mergedPosts,
    } as PostList);
  }

  private convertPost(post: Post) {
    return {
      ...post,
      create_at: new Date(post.create_at),
      update_at: new Date(post.update_at),
      edit_at: post.edit_at !== 0 ? new Date(post.edit_at) : '',
      delete_at: post.delete_at !== 0 ? new Date(post.delete_at) : '',
    };
  }

  private convertPostList(postList: PostList) {
    // Use a single-pass loop instead of reduce+spread (which is O(n²) due to
    // copying the accumulator on every iteration). `convertPost` already
    // spreads the source post, so no extra outer spread is needed.
    const posts: Record<string, ReturnType<typeof this.convertPost>> = {};
    for (const postId of postList.order) {
      const raw = postList.posts[postId];
      if (raw) {
        posts[postId] = this.convertPost(raw);
      }
    }
    return { ...postList, posts };
  }

  private convertReaction(reaction: Reaction) {
    return {
      ...reaction,
      create_at: new Date(reaction.create_at),
    };
  }

  private convertChannel(channel: Channel) {
    return {
      ...channel,
      create_at: new Date(channel.create_at),
      update_at: new Date(channel.update_at),
      delete_at: channel.delete_at !== 0 ? new Date(channel.delete_at) : '',
    };
  }

  private convertUserProfile(user: UserProfile) {
    return {
      ...user,
      create_at: new Date(user.create_at),
      update_at: new Date(user.update_at),
      delete_at: user.delete_at !== 0 ? new Date(user.delete_at) : '',
    };
  }
}
