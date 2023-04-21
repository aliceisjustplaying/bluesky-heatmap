export const shiftDate = (date: Date, numDays: number) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + numDays);
  return newDate;
};

// source: https://github.com/bluesky-social/atproto/blob/efb1cac2bfc8ccb77c0f4910ad9f3de7370fbebb/packages/bsky/tests/_util.ts#L314
export const paginateAll = async <T extends { cursor?: string }>(
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

export const getUserCreatedAt = async (actor: string) => {
  // source: https://github.com/mimonelu/klearsky/blob/079746c1c1a03d3a9f0961bdb69bb223dcb106c3/src/composables/main-state.ts#L98
  const log = await fetch(`https://plc.directory/${actor}/log/audit`);
  const logJson = await log.json();
  const createdAt = logJson[0]?.createdAt;

  return createdAt;
};
