declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY: string;
    KV_URL: string;
    KV_REST_API_URL: string;
    KV_REST_API_TOKEN: string;
    KV_REST_API_READ_ONLY_TOKEN: string;
  }
}
