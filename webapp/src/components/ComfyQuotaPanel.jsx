import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase.js';
import { readComfyQuotaViaFirebase } from '../lib/comfyCloudProxyClient.js';
import { formatComfyQuota } from '../lib/comfyQuotaDisplay.js';

export function ComfyQuotaView({ data, loading, error, signedIn, onRefresh }) {
  const display = formatComfyQuota(data);
  return <section className="dll-pic-quota" aria-label="Comfy Cloud 額度" aria-busy={loading}>
    <div className="dll-pic-quota-header">
      <span>Comfy Cloud</span>
      <button type="button" className="secondary" onClick={onRefresh} disabled={!signedIn || loading} aria-label="重新整理 Comfy Cloud 額度">{loading ? '查詢中…' : '重新整理'}</button>
    </div>
    <div className="dll-pic-quota-values" aria-live="polite">
      <div><span>剩餘額度</span><strong>{!signedIn ? '請先登入' : loading && !data ? '查詢中…' : display.balance}</strong></div>
      <div><span>預估可生成</span><strong>{!signedIn ? '—' : loading && !data ? '查詢中…' : display.estimate}</strong></div>
    </div>
    {signedIn && <p className="dll-pic-model-note">依目前模型、解析度與比例估算，實際耗額可能不同。</p>}
    {data && <p className="dll-pic-model-note">更新於 {display.updated}{loading ? ' · 更新中' : ''}</p>}
    {error && <p className="dll-pic-quota-error" role="status">{error}</p>}
  </section>;
}

export function ComfyQuotaSession({ modelKey, resolution, aspectRatio, refreshToken, loadQuota = readComfyQuotaViaFirebase }) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      setState(previous => ({ ...previous, loading: true, error: '' }));
      try {
        const data = await loadQuota({ modelKey, resolution, aspectRatio });
        if (active) setState({ data, loading: false, error: '' });
      } catch (error) {
        const message = error?.code === 'functions/not-found'
          ? '額度服務尚未啟用'
          : '更新失敗，請稍後重新整理';
        if (active) setState(previous => ({ ...previous, loading: false, error: message }));
      }
    });
    return () => { active = false; };
  }, [modelKey, resolution, aspectRatio, revision, refreshToken, loadQuota]);
  return <ComfyQuotaView {...state} signedIn onRefresh={() => setRevision(value => value + 1)} />;
}

export default function ComfyQuotaPanel(props) {
  const [user, setUser] = useState(() => firebaseAuth?.currentUser || null);
  useEffect(() => firebaseAuth ? onAuthStateChanged(firebaseAuth, setUser) : undefined, []);
  return user
    ? <ComfyQuotaSession key={`${user.uid}:${props.modelKey}:${props.resolution}:${props.aspectRatio}`} {...props} />
    : <ComfyQuotaView signedIn={false} loading={false} />;
}
