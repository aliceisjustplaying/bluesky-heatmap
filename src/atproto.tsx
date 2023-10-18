import * as bsky from '@atproto/api';
import { getUserCreatedAt, paginateAll } from './helpers.tsx';

export const getData = async (agent: bsky.BskyAgent, actor = '') => {
  actor = (await agent.getProfile({ actor })).data.did;

  // source: https://github.com/bluesky-social/atproto/blob/efb1cac2bfc8ccb77c0f4910ad9f3de7370fbebb/packages/bsky/tests/views/author-feed.test.ts#L94
  const paginator = async (cursor?: string) => {
    const res = await agent.getAuthorFeed({
      actor: actor,
      cursor,
      limit: 100,
    });
    return res.data;
  };

  const paginatedAll = await paginateAll(paginator);

  const posts: object[] = [];

  paginatedAll.forEach((res) => {
    if (typeof res.feed[0] !== 'undefined') {
      posts.push(
        ...res.feed.map((e) => ({
          text: (e.post.record as any).text,
          uri: e.post.uri.replace('app.bsky.feed.', '').replace('at://', 'https://staging.bsky.app/profile/'),
          likeCount: e.post.likeCount,
          did: e.post.author.did,
          handle: e.post.author.handle,
          isOwn: e.post.author.did === actor,
          repostCount: e.post.repostCount,
          isRepost: e.post.repostCount === 0 ? false : true,
          createdAt: (e.post.record as any).createdAt,
        })),
      );
    }
  });

  const groupedPosts = posts.reduce((acc: any, obj: any) => {
    const key = obj.createdAt.slice(0, 10);
    if (!acc[key]) {
      acc[key] = { date: key, count: 0 };
    }
    if (obj.isOwn) acc[key].count++;
    return acc;
  }, {});

  // i don't need the outer object, i just need an array with the values
  const data = Object.values(groupedPosts);

  const max = Math.max(...data.map((o: any) => o.count));

  const createdAt = await getUserCreatedAt(actor);

  return {
    data,
    max,
    createdAt,
  };
};
