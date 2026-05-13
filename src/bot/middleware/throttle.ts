import { apiThrottler } from '@grammyjs/transformer-throttler';

export function createThrottleMiddleware() {
  return apiThrottler();
}
