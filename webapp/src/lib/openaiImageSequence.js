import { isOpenAI26, openAI26Settings } from './openaiImage26.js';

export async function generateOpenAISequence(task, { submit, onProgress, onImages }) {
  const images = [];
  const batchSize = isOpenAI26(task.snapshot.modelKey) && task.snapshot.count === 4 ? 4 : 1;
  for (let i = 1; i <= task.snapshot.count; i += batchSize) {
    await onProgress({ status: 'running', sequenceIndex: i, sequenceTotal: task.snapshot.count });
    try {
      const data = await submit({ ...(batchSize === 4 ? { count: 4 } : {}), prompt: task.snapshot.prompt, quality: task.snapshot.quality, resolution: task.snapshot.resolution,
        aspectRatio: task.snapshot.aspectRatio, ...(isOpenAI26(task.snapshot.modelKey) ? { ...openAI26Settings(task.snapshot), modelKey: task.snapshot.modelKey } : {}), requestId: `${task.id}_${i}` });
      if (!data?.images?.length) throw new Error('OpenAI 未回傳圖片，請先確認用量');
      images.push(...data.images);
      await onImages([...images]);
      if (data.images.length !== batchSize) {
        return { images, errors: [`OpenAI 回傳 ${data.images.length}／${batchSize} 張，已保留收到的圖片。`],
          meta: { requestedCount: task.snapshot.count, completedCount: images.length, partial: true } };
      }
    } catch (error) {
      error.images = images;
      if (['functions/invalid-argument', 'functions/permission-denied', 'functions/resource-exhausted', 'functions/unauthenticated', 'functions/not-found'].includes(error.code)) error.terminal = true;
      throw error;
    }
  }
  return { images, errors: [], meta: { requestedCount: task.snapshot.count, completedCount: images.length } };
}
