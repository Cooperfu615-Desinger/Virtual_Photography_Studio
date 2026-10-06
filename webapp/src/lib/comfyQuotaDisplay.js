export function formatComfyQuota(data) {
  const finite = (value) => typeof value === 'number' && Number.isFinite(value);
  return {
    balance: finite(data?.credits) ? `${Math.round(data.credits).toLocaleString('zh-TW')} Credits` : '暫時無法取得',
    estimate: Number.isSafeInteger(data?.estimatedImages) && data.estimatedImages >= 0
      ? `約 ${data.estimatedImages.toLocaleString('zh-TW')} 張`
      : data?.estimateUnavailableReason === 'partnerPricing' ? '此模型暫不估算張數'
        : data?.sampleReadFailed ? '估算資料暫時無法取得'
        : data && !finite(data.credits) ? '暫時無法估算' : '尚無足夠估算資料',
    updated: finite(data?.checkedAt) ? new Date(data.checkedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '',
  };
}
