import { handleRequest } from '../src/index.js';
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // 1. Construct Env object
  const env = {
    LINKS_CHANNEL: process.env.LINKS_CHANNEL,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    REFRESH_TOKEN: process.env.REFRESH_TOKEN,

    // 2. Polyfill GDFLIX_DATA (Cloudflare KV) using Vercel KV (Redis)
    GDFLIX_DATA: {
        async get(key) {
            return await kv.get(key);
        },
        async put(key, value) {
            // value is a JSON string in the worker code, Redis stores strings fine.
            return await kv.set(key, value);
        },
        async list({ prefix, cursor, limit }) {
            // Cloudflare KV list: { keys: [{ name: "key1" }, ...], list_complete: bool, cursor: string }
            // Redis scan: [cursor, [keys...]]

            // Default count to limit or 50
            const count = limit || 50;
            // scan(cursor, { match, count })
            // Note: kv.scan return format in @vercel/kv depends on client.
            // Standard Redis command returns [cursor, [keys]].
            // @vercel/kv `scan` method signature: kv.scan(cursor, { match: ..., count: ... })

            // Cursor in Redis is an integer (usually), initially 0.
            const currentCursor = cursor || 0;

            // We use 'match' to simulate prefix. Redis MATCH is a glob.
            const match = prefix ? `${prefix}*` : '*';

            const [nextCursor, keys] = await kv.scan(currentCursor, { match, count });

            const listComplete = nextCursor === 0 || nextCursor === '0';

            // Map keys to CF KV format
            const mappedKeys = keys.map(k => ({ name: k }));

            return {
                keys: mappedKeys,
                list_complete: listComplete,
                cursor: listComplete ? null : String(nextCursor)
            };
        }
    }
  };

  return handleRequest(request, env);
}
