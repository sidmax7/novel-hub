import { NextResponse } from 'next/server';

const REDIS_URL = process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN;

async function redisRequest(endpoint: string, options: RequestInit = {}) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Redis credentials are not configured');
  }

  try {
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    const response = await fetch(`${REDIS_URL}${formattedEndpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Redis error response:', data);
      throw new Error(`Redis request failed: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error('Redis request failed:', {
      endpoint,
      error: error instanceof Error ? error.message : error,
      url: REDIS_URL,
      hasToken: !!REDIS_TOKEN,
      headers: options.headers,
    });
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    console.log('Fetching from Redis, key:', key);
    const result = await redisRequest(`/get/${key}`);
    console.log('Redis response:', result?.result ? 'Data found' : 'No data found');
    
    return NextResponse.json({ data: result?.result });
  } catch (error) {
    console.error('Redis GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value, ttl } = body;
    
    console.log('Received POST request:', {
      key,
      valueType: typeof value,
      valueLength: typeof value === 'string' ? value.length : JSON.stringify(value).length,
      ttl
    });
    
    if (!key || value === undefined) {
      return NextResponse.json({ 
        error: 'Key and value are required',
        receivedKey: key,
        receivedValue: typeof value 
      }, { status: 400 });
    }

    // Convert value to string if it's an object
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
    
    if (stringValue.length > 1000000) {
      console.warn('Large value detected, might exceed Redis limits:', stringValue.length);
      return NextResponse.json({ 
        error: 'Value too large',
        size: stringValue.length,
        limit: 1000000
      }, { status: 400 });
    }

    console.log('Setting Redis key:', key, 'with TTL:', ttl);
    
    const endpoint = ttl ? 
      `/set/${encodeURIComponent(key)}/${encodeURIComponent(stringValue)}/ex/${ttl}` : 
      `/set/${encodeURIComponent(key)}/${encodeURIComponent(stringValue)}`;
    
    try {
      const setResult = await redisRequest(endpoint, {
        method: 'POST'
      });
      
      console.log('Redis SET response:', setResult);
      
      // Verify the data was cached
      const verifyResult = await redisRequest(`/get/${encodeURIComponent(key)}`);
      console.log('Verification result:', {
        exists: !!verifyResult?.result,
        storedLength: verifyResult?.result ? 
          (typeof verifyResult.result === 'string' ? verifyResult.result.length : JSON.stringify(verifyResult.result).length) 
          : 0
      });
      
      return NextResponse.json({ 
        success: true,
        verificationResult: !!verifyResult?.result
      });
    } catch (redisError) {
      console.error('Redis operation failed:', redisError);
      return NextResponse.json({ 
        error: 'Redis operation failed',
        details: redisError instanceof Error ? redisError.message : redisError
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : error
    }, { status: 500 });
  }
} 