import { useState, useMemo, useCallback, FormEvent, ChangeEvent } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip';
import * as bsky from '@atproto/api';
const { BskyAgent } = bsky;
import type { AtpSessionEvent, AtpSessionData } from '@atproto/api';
import { getData } from './atproto.tsx';

type PostsData = Awaited<ReturnType<typeof getData>>;

export const App = () => {
  const [data, setData] = useState<PostsData | undefined>();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [heatmapSubject, setHeatmapSubject] = useState<string>('');
  const [session, setSession] = useState<AtpSessionData>();

  const posts = data?.data ?? [];
  const max = data?.max ?? 0;
  const createdAt = new Date(data?.createdAt);

  const agent = useMemo(
    () =>
      new BskyAgent({
        service: 'https://bsky.social',
        persistSession: (_evt: AtpSessionEvent, sess?: AtpSessionData) => {
          console.log('setSession', sess);
          if (sess != null) {
            setSession(sess!);
          }
        },
      }),
    [],
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    console.log('loadPosts');
    try {
      const data = await getData(agent!, session!, heatmapSubject);
      setData(data);
    } finally {
      setIsLoading(false);
    }
  }, [agent, session, heatmapSubject]);

  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const login = useCallback(async () => {
    await agent!.login({
      identifier: username,
      password: password,
    });
    setLoggedIn(true);
  }, [username, password, agent]);

  const handleLoginSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await login();
    },
    [login],
  );

  const handleUsernameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setHeatmapSubject(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const handleHeatmapSubjectChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setHeatmapSubject(e.target.value);
  }, []);

  return (
    <div>
      <h1>Bluesky Posts Heatmap Generator</h1>
      {!loggedIn && (
        <>
          <div id="loginMessage">Please log in</div>
          <br />
        </>
      )}
      <form id="login" onSubmit={handleLoginSubmit}>
        Username:&nbsp;
        <input type="text" placeholder="username" onChange={handleUsernameChange} value={username} />
        <br />
        Password:&nbsp;
        <input type="password" placeholder="password" onChange={handlePasswordChange} value={password} />
        <input type="submit" value="login" disabled={loggedIn} />
        <br />
        <br />
      </form>
      <div id="actor">
        🦋&nbsp;
        <input
          type="text"
          placeholder="Bluesky username"
          onChange={handleHeatmapSubjectChange}
          value={heatmapSubject}
        />
        <input type="button" value="Get heatmap" onClick={loadPosts} disabled={!loggedIn || isLoading} />
      </div>
      <div>
        <br />
      </div>
      {isLoading ? <div>Loading...</div> : null}
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
