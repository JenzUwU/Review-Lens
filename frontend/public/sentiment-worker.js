import {
  env,
  pipeline,
} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2';

env.allowLocalModels = false;

const MODEL_ID = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

class SentimentPipeline {
  static instance = null;

  static getInstance(progressCallback) {
    if (!this.instance) {
      this.instance = pipeline('sentiment-analysis', MODEL_ID, {
        dtype: 'q8',
        progress_callback: progressCallback,
      });
    }

    return this.instance;
  }
}

self.addEventListener('message', async ({ data }) => {
  if (data.type !== 'analyze') return;

  try {
    const classifier = await SentimentPipeline.getInstance((event) => {
      self.postMessage({ type: 'model-progress', event });
    });
    const results = [];

    for (let index = 0; index < data.reviews.length; index += 1) {
      const [result] = await classifier(data.reviews[index], {
        truncation: true,
      });

      results.push(result);
      self.postMessage({
        type: 'analysis-progress',
        current: index + 1,
        total: data.reviews.length,
      });
    }

    self.postMessage({ type: 'complete', results });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
