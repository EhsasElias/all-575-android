type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * The API client tells the rest of the app when the server rejects the current token (expired, revoked from
 * another device). The session reacts by signing the customer out; the api layer knows nothing about sessions.
 */
export const authEvents = {
  onUnauthorized(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emitUnauthorized(): void {
    for (const listener of listeners) listener();
  },
};
