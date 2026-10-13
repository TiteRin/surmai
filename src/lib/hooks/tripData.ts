// The trip page and each of its panels subscribe to the same queries: without it,
// every panel mounting would fetch again what the page has just loaded
export const TRIP_DATA_STALE_TIME = 30 * 1000;
