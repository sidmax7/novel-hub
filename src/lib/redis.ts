import { kv } from '@vercel/kv';

const redis = kv;

export async function getNovelCache() {
  try {
    const novels = await redis.get('all_novels_test_v3');
    if (!novels) return null;
    
    // If novels is already an array, return it directly
    if (Array.isArray(novels)) {
      return novels;
    }
    
    // If it's a string, try to parse it
    if (typeof novels === 'string') {
      try {
        return JSON.parse(novels);
      } catch (error) {
        console.error('Error parsing Redis data:', error);
        return null;
      }
    }
    
    // If it's an object but not an array, wrap it in an array
    if (typeof novels === 'object' && novels !== null) {
      return [novels];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching from Redis:', error);
    return null;
  }
}

export async function setNovelCache(novels: any, ttl: number = 3600) {
  try {
    // Ensure we're storing a JSON string
    const data = typeof novels === 'string' ? novels : JSON.stringify(novels);
    await redis.set('all_novels_test_v3', data, { ex: ttl });
    return true;
  } catch (error) {
    console.error('Error setting Redis cache:', error);
    return false;
  }
}

export { redis };
