const TIMEOUT_MS = 6_000;

/** Whether the server at this API address answers. Sends no token and reads nothing but the status. */
export async function checkServer(address: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);
  try {
    const response = await fetch(`${address}/store`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
