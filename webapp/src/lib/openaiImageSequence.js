export async function generateOpenAISequence(task, { submit, onProgress, onImages }) {
  const images = [];
  for (let i = 1; i <= task.snapshot.count; i += 1) {
    await onProgress({ status: 'running', sequenceIndex: i, sequenceTotal: task.snapshot.count });
    try {
      const data = await submit({ prompt: task.snapshot.prompt, quality: task.snapshot.quality, resolution: task.snapshot.resolution,
        aspectRatio: task.snapshot.aspectRatio, requestId: `${task.id}_${i}` });
      if (!data?.images?.length) throw new Error('OpenAI 未回傳圖片，請先確認用量');
      images.push(...data.images);
      await onImages([...images]);
    } catch (error) {
      error.images = images;
      if (['functions/invalid-argument', 'functions/permission-denied', 'functions/resource-exhausted', 'functions/unauthenticated', 'functions/not-found'].includes(error.code)) error.terminal = true;
      throw error;
    }
  }
  return { images, errors: [], meta: { requestedCount: task.snapshot.count, completedCount: images.length } };
}
