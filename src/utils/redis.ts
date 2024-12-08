import { Redis } from '@upstash/redis';

// Create Redis instance only on the server side
const getRedisClient = () => {
  if (typeof window === 'undefined') {
    return new Redis({
      url: process.env.NEXT_PUBLIC_REDIS_URL || '',
      token: process.env.NEXT_PUBLIC_REDIS_TOKEN || '',
    });
  }
  return null;
};

export const redis = getRedisClient(); 
//hash//