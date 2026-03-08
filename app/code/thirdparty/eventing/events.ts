/**
 * A subscriber callback that receives an event payload, optionally transforms
 * it, and returns it for the next subscriber in the chain.
 *
 * @typeParam T - The shape of the event payload.
 *
 * @remarks
 * Because {@link publish} passes the return value of each subscriber to the
 * next, subscribers act as a **pipeline** — each one can read, enrich, or
 * modify the data before it continues down the chain. Subscribers should
 * always return the payload, even if unchanged.
 *
 * @example
 * ```ts
 * const logContent: Subscriber<ContentChangedEvent> = async (data) => {
 *   console.log("Content changed:", data.path);
 *   return data;
 * };
 * ```
 */
export type Subscriber<T> = (data: T) => Promise<T>;

/**
 * Internal registry mapping event names to their ordered list of subscribers.
 *
 * @internal
 */
const subscriberMap: Record<string, Subscriber<unknown>[]> = {};

/**
 * Registers a callback to be invoked whenever the named event is published.
 *
 * Subscribers are called in registration order. Multiple subscribers on the
 * same event form a pipeline — see {@link Subscriber} and {@link publish}.
 *
 * @param eventName - The event to subscribe to.
 * @param callback  - The {@link Subscriber} to invoke when the event fires.
 *
 * @example
 * ```ts
 * subscribe('content:changed', async (data) => {
 *   await invalidateCache(data.cacheKey);
 *   return data;
 * });
 * ```
 */
export const subscribe = <T>(eventName: string, callback: Subscriber<T>) => {
  if (!subscriberMap[eventName]) {
    subscriberMap[eventName] = [];
  }
  subscriberMap[eventName].push(callback as Subscriber<unknown>);
};

/**
 * Publishes an event, passing the payload through each registered subscriber
 * in a sequential pipeline.
 *
 * @typeParam T - The shape of the event payload.
 * @param eventName - The event to publish.
 * @param data      - The initial payload passed to the first subscriber.
 * @returns The payload as returned by the final subscriber in the chain, or
 *          the original `data` if no subscribers are registered.
 *
 * @remarks
 * Subscribers are awaited **sequentially**, not concurrently. Each subscriber
 * receives the return value of the previous one, making this a reducer-style
 * pipeline rather than a fan-out broadcast. Order of subscriber registration
 * therefore matters.
 *
 * @example
 * ```ts
 * const result = await publish('content:changed', {
 *   path: 'work/project-a.json',
 *   cacheKey: 'abc123',
 * });
 * ```
 */
export const publish = async <T>(eventName: string, data: T): Promise<T> => {
  const subscribers = subscriberMap[eventName] || [];

  for (const subscriber of subscribers) {
    data = await subscriber(data) as T;
  }

  return data;
};