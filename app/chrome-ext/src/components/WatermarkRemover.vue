<script setup lang="ts">
import { ref } from 'vue';
import { WatermarkEngine } from '../lib/watermark-engine';

const originalImage = ref<string | null>(null);
const cleanImage = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const isProcessing = ref(false);
const statusMsg = ref('Select an image to start.');

const fileInput = ref<HTMLInputElement | null>(null);

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    selectedFile.value = file;
    originalImage.value = URL.createObjectURL(file);
    cleanImage.value = null;
    statusMsg.value = 'Ready to process.';
  }
}

async function processImage() {
  if (!selectedFile.value) return;

  isProcessing.value = true;
  statusMsg.value = 'Processing...';

  try {
    const engine = new WatermarkEngine();
    await engine.init();
    
    // Returns Data URL
    const resultDataUrl = await engine.removeWatermark(selectedFile.value);
    
    cleanImage.value = resultDataUrl;
    statusMsg.value = 'Done!';
  } catch (err) {
    console.error(err);
    statusMsg.value = `Error: ${err}`;
  } finally {
    isProcessing.value = false;
  }
}

function downloadImage() {
  if (!cleanImage.value) return;
  
  const link = document.createElement('a');
  link.href = cleanImage.value;
  link.download = `cleaned_${selectedFile.value?.name || 'image.png'}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <div class="container">
    <div class="controls">
      <input 
        type="file" 
        ref="fileInput" 
        accept="image/*" 
        style="display: none" 
        @change="handleFileChange" 
      />
      <button @click="triggerFileInput" class="btn primary">Select Image</button>
      <button @click="processImage" :disabled="!selectedFile || isProcessing" class="btn success">
        {{ isProcessing ? 'Processing...' : 'Remove Watermark' }}
      </button>
      <button @click="downloadImage" :disabled="!cleanImage" class="btn secondary" v-if="cleanImage">
        Download Result
      </button>
    </div>

    <div class="status-bar" v-if="statusMsg">
      {{ statusMsg }}
    </div>

    <div class="preview-area">
      <div class="card" v-if="originalImage">
        <h3>Original</h3>
        <img :src="originalImage" alt="Original" />
      </div>

      <div class="arrow" v-if="originalImage && cleanImage">➔</div>

      <div class="card" v-if="cleanImage">
        <h3>Clean</h3>
        <img :src="cleanImage" alt="Clean" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  width: 100%;
}

.controls {
  display: flex;
  gap: 1rem;
}

.status-bar {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: monospace;
}

.preview-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  width: 100%;
  flex-wrap: wrap;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 45%;
}

.card img {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.arrow {
  font-size: 2rem;
  color: #646cff;
}
</style>
