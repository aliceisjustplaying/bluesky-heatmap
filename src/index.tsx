import React from 'react';
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import './react-calendar-heatmap.css';
import './styles.css';
import * as bsky from '@atproto/api';
const { BskyAgent } = bsky;
import { config } from './config.js';

async function getData(actor = '') {
  const agent = new BskyAgent({
    service: 'https://bsky.social',
  });

  await agent.login({
    identifier: config.identifier,
    password: config.password,
  });

  // source: https://github.com/bluesky-social/atproto/blob/efb1cac2bfc8ccb77c0f4910ad9f3de7370fbebb/packages/bsky/tests/_util.ts#L314
  const paginateAll = async <T extends { cursor?: string }>(
    fn: (cursor?: string) => Promise<T>,
    limit = Infinity,
  ): Promise<T[]> => {
    const results: T[] = [];
    let cursor;
    do {
      const res = await fn(cursor);
      results.push(res);
      cursor = res.cursor;
    } while (cursor && results.length < limit);
    return results;
  };

  if (actor === '') {
    actor = agent.session!.did;
  } else {
    actor = (await agent.getProfile({ actor })).data.did;
  }

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

  const groupedPosts = posts.reduce((acc, obj: any) => {
    const key = obj.createdAt.slice(0, 10);
    if (!acc[key]) {
      acc[key] = { date: key, count: 0 };
    }
    if (obj.isOwn) acc[key].count++;
    return acc;
  }, {});

  // i don't need the outer object, i just need an array with the values
  const data = Object.values(groupedPosts);

  const max = Math.max(...data.map((o) => o.count));

  // source: https://github.com/mimonelu/klearsky/blob/079746c1c1a03d3a9f0961bdb69bb223dcb106c3/src/composables/main-state.ts#L98
  const log = await fetch(`https://plc.directory/${actor}/log/audit`);
  const logJson = await log.json();
  const createdAt = logJson[0]?.createdAt;

  return {
    data,
    max,
    createdAt,
  };
}

const today = new Date();

function App() {
  const [posts, setPosts] = useState<any>([]);
  const [max, setMax] = useState<any>(0);
  const [createdAt, setCreatedAt] = useState<any>();
  const [actor, setActor] = useState<any>('');
  const [updated, setUpdated] = useState(actor);

  useEffect(() => {
    let ignore = false;

    getData(actor).then((data) => {
      if (!ignore) {
        setPosts(data.data);
        setMax(data.max);
        setCreatedAt(new Date(data.createdAt));
      }
    });

    return () => {
      ignore = true;
    };
  }, [updated, max]);
  return (
    <div>
      <h1>Bluesky Posts Heatmap</h1>
      <div id="actor">
        <input type="text" placeholder="Enter a BlueSky DID" onChange={(e) => setActor(e.target.value)} value={actor} />
        <input
          type="button"
          value="Submit"
          onClick={() => {
            setMax(0);
            setUpdated(actor);
          }}
        />
      </div>
      <div>
        <br />
      </div>
      {max === 0 ? (
        <p>Loading...</p>
      ) : (
        <>
          <CalendarHeatmap
            startDate={createdAt}
            endDate={today}
            values={posts}
            classForValue={(value) => {
              if (!value) {
                return 'color-empty';
              }
              // return `color-github-${value.count > 0 ? Math.ceil((value.count / max) * 4) : 0}`;
              return `color-custom-${value.count > 0 ? Math.ceil((value.count / max) * 17) : 0}`;
            }}
            tooltipDataAttrs={(value) => {
              return {
                'data-tooltip-id': 'my-tooltip',
                'data-tooltip-content': value.date !== null ? `${value.date} has ${value.count} posts` : 'no posts',
                'data-tooltip-place': 'top',
              };
            }}
            showWeekdayLabels={true}
            gutterSize={1}
            showOutOfRangeDays={true}
          />
          <Tooltip id="my-tooltip" />
        </>
      )}
    </div>
  );
}

function shiftDate(date, numDays) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + numDays);
  return newDate;
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
