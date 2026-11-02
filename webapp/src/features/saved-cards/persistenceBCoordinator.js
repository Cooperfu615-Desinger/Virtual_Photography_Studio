// Isolated B test coordinator: only revision notifications cross tabs.
// No card payload, production startup hook, or cloud sender is included.
export function createIsolatedRevisionNotifier({ name, Channel, eventTarget, readRevision, onRevision, onError = () => {} }) {
  if (typeof name !== 'string' || !name.startsWith('vps-saved-cards-b-test-') || typeof readRevision !== 'function' || typeof onRevision !== 'function') {
    throw new Error('Isolated test notifier and revision callbacks required');
  }
  let closed = false;
  const refresh = async () => {
    const revision = await readRevision();
    if (!closed) onRevision(revision);
  };
  const channel = Channel ? new Channel(name) : null;
  if (channel) channel.onmessage = () => { void refresh().catch(onError); };
  const onFocus = () => { void refresh().catch(onError); };
  const onVisibility = () => { if (!eventTarget.document?.hidden) void refresh().catch(onError); };
  eventTarget?.addEventListener('focus', onFocus);
  eventTarget?.document?.addEventListener('visibilitychange', onVisibility);
  return Object.freeze({
    publish() { if (closed) throw new Error('Notifier closed'); channel?.postMessage({ kind: 'revision-changed' }); },
    refresh,
    close() {
      closed = true;
      channel?.close();
      eventTarget?.removeEventListener('focus', onFocus);
      eventTarget?.document?.removeEventListener('visibilitychange', onVisibility);
    },
  });
}


export function withIsolatedMigrationLock({ lockManager, name, operation }) {
  if (typeof name !== 'string' || !name.startsWith('vps-saved-cards-b-test-') || typeof operation !== 'function') throw new Error('Isolated lock required');
  if (!lockManager) return operation();
  return lockManager.request(name, { mode: 'exclusive', ifAvailable: true }, lock => {
    if (!lock) throw new Error('Migration Web Lock unavailable');
    return operation();
  });
}
