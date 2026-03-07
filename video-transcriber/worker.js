// worker.js
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// Optimize performance by avoiding local model check
env.allowLocalModels = false;

class PipelineSingleton {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Preload the model
async function load() {
    self.postMessage({ status: 'initiate' });
    try {
        await PipelineSingleton.getInstance(x => {
            // Send download progress to main thread
            self.postMessage({
                status: 'progress',
                file: x.file,
                progress: x.progress
            });
        });
        self.postMessage({ status: 'ready' });
        self.postMessage({ status: 'done' });
    } catch (e) {
        self.postMessage({ status: 'error', message: e.message });
    }
}
load();

// Listen for messages from main thread
self.addEventListener('message', async (e) => {
    const { audio, language, task } = e.data;

    try {
        const transcriber = await PipelineSingleton.getInstance();

        self.postMessage({ status: 'start' });

        // Run inference
        const output = await transcriber(audio, {
            language: language, // 'zh', 'en', 'vi'...
            task: task, // 'transcribe' or 'translate' (Translate is always into English in Whisper)
            chunk_length_s: 30,
            stride_length_s: 5,

            // Callback to stream text back to the UI chunk by chunk
            callback_function: x => {
                // x returns partial structures. 
                // We'll catch and send them.
            },

            // Return timestamps 
            return_timestamps: true,
        });

        // The overall output when done
        if (output && output.chunks) {
            output.chunks.forEach(chunk => {
                self.postMessage({
                    status: 'update',
                    chunk: { text: chunk.text, timestamp: chunk.timestamp }
                });
            });
        } else if (output && output.text) {
            self.postMessage({
                status: 'update',
                chunk: { text: output.text, timestamp: null }
            });
        }

        self.postMessage({ status: 'complete' });

    } catch (err) {
        console.error(err);
        self.postMessage({ status: 'error', message: err.message });
    }
});
