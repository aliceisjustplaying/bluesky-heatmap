import { useState, useMemo, useCallback, ChangeEvent } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip';
import * as bsky from '@atproto/api';
const { BskyAgent } = bsky;
import { getData } from './atproto.tsx';

type PostsData = Awaited<ReturnType<typeof getData>>;

export const App = () => {
  const [data, setData] = useState<PostsData | undefined>();
  const [heatmapSubject, setHeatmapSubject] = useState<string>('');

  const posts = data?.data ?? [];
  const max = data?.max ?? 0;
  const createdAt = new Date(data?.createdAt);

  const agent = useMemo(
    () =>
      new BskyAgent({
        service: 'https://api.bsky.app',
      }),
    [],
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const loadPosts = useCallback(async () => {
    try {
      let actor: any;
      try {
        actor = (await agent.getProfile({ actor: heatmapSubject.trim().replace('@', '') })).data.did;
      } catch (e) {
        alert('Invalid username!');
        return;
      }
      setIsLoading(true);
      const data = await getData(agent!, actor);
      setData(data);
    } finally {
      setIsLoading(false);
    }
  }, [agent, heatmapSubject]);

  const handleHeatmapSubjectChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setHeatmapSubject(e.target.value);
  }, []);

  return (
    <div>
      <h1>Bluesky Posts Heatmap Generator</h1>
      <br />
      <div id="actor">
        🦋&nbsp;
        <input
          type="text"
          placeholder="Bluesky username"
          onChange={handleHeatmapSubjectChange}
          value={heatmapSubject}
        />
        <input type="button" value="Get heatmap" onClick={loadPosts} disabled={isLoading} />
      </div>
      <div>
        <br />
        <br />
      </div>
      {isLoading ? <div>Loading... (This might take a minute or two. No, really.)</div> : null}
      {posts.length === 0 || isLoading ? null : (
        <>
          <CalendarHeatmap
            startDate={createdAt}
            endDate={new Date()}
            values={posts}
            classForValue={(value) => {
              if (!value) {
                return 'color-empty';
              }
              // return `color-github-${value.count > 0 ? Math.ceil((value.count / max) * 4) : 0}`;
              return `color-custom-${value.count > 0 ? Math.ceil((value.count / max) * 17) : 0}`;
            }}
            tooltipDataAttrs={(value: any) => {
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
};
