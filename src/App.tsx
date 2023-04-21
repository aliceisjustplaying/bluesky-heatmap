import { useState, useEffect, useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip';
import * as bsky from '@atproto/api';
const { BskyAgent } = bsky;
import type { AtpSessionEvent, AtpSessionData } from '@atproto/api';
import { getData } from './atproto.tsx';

export const App = () => {
  const [posts, setPosts] = useState<any>([]);
  const [max, setMax] = useState<number>(0);
  const [createdAt, setCreatedAt] = useState<Date>();
  const [actor, setActor] = useState<string>('');
  const [updated, setUpdated] = useState<string>(actor);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginPressed, setLoginPressed] = useState<boolean>(false);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [session, setSession] = useState<AtpSessionData>();
  const [agent, setAgent] = useState<bsky.BskyAgent>();

  useMemo(() => {
    const agent = new BskyAgent({
      service: 'https://bsky.social',
      persistSession: (_evt: AtpSessionEvent, sess?: AtpSessionData) => {
        setSession(sess!);
      },
    });

    setAgent(agent);
  }, []);

  useEffect(() => {
    let ignore = false;
    setPosts([]);

    if (loggedIn) {
      setIsLoading(true);
      getData(agent!, session!, updated).then((data) => {
        if (!ignore) {
          setPosts(data.data);
          setMax(data.max);
          setCreatedAt(new Date(data.createdAt));
          setIsLoading(false);
        }
      });
    }

    return () => {
      ignore = true;
    };
  }, [agent, session, updated, loggedIn]);

  useEffect(() => {
    let ignore = false;
    if (loginPressed && !ignore) {
      agent!
        .login({
          identifier: username,
          password: password,
        })
        .then(() => {
          setLoggedIn(true);
        });
    }
    return () => {
      ignore = true;
    };
  }, [agent, username, password, loginPressed]);

  return (
    <div>
      <h1>Bluesky Posts Heatmap Generator</h1>
      {loggedIn === false ? (
        <>
          <div id="loginMessage">Please log in</div>
          <br />
        </>
      ) : null}
      <div id="login">
        Username:&nbsp;
        <input type="text" placeholder="username" onChange={(e) => setUsername(e.target.value)} value={username} />
        <br />
        Password:&nbsp;
        <input type="password" placeholder="password" onChange={(e) => setPassword(e.target.value)} value={password} />
        <input
          type="button"
          value="login"
          onClick={() => {
            setLoginPressed(true);
            setActor(username);
          }}
          disabled={loggedIn}
        />
        <br />
        <br />
      </div>
      <div id="actor">
        🦋&nbsp;
        <input type="text" placeholder="Bluesky username" onChange={(e) => setActor(e.target.value)} value={actor} />
        <input
          type="button"
          value="Get heatmap"
          onClick={() => {
            setMax(0);
            setUpdated(actor);
          }}
          disabled={!loggedIn || isLoading}
        />
      </div>
      <div>
        <br />
      </div>
      {isLoading ? <div>Loading...</div> : null}
      {posts.length === 0 ? null : (
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
