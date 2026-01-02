<script setup lang="ts">
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
// import { convertFileSrc } from '@tauri-apps/api/core'; // Not used anymore
import { readFile } from '@tauri-apps/plugin-fs';

const originalImage = ref<string | null>(null);
const cleanImage = ref<string | null>(null);
const originalPath = ref<string>('');
const cleanPath = ref<string>('');
const isProcessing = ref(false);
const statusMsg = ref('');

// Helper to convert file path to Blob URL via IPC
async function loadFileToBlob(path: string): Promise<string> {
    const contents = await readFile(path);
    const blob = new Blob([contents]);
    return URL.createObjectURL(blob);
}

async function selectFile() {
  try {
    const file = await open({
      multiple: false,
      filters: [{
        name: 'Image',
        extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp']
      }]
    });

      const pathStr = file as string;
      
      if (pathStr) {
          originalPath.value = pathStr;
          // Use readFile -> Blob URL instead of asset protocol
          originalImage.value = await loadFileToBlob(pathStr);
          
          cleanImage.value = null;
          cleanPath.value = '';
          statusMsg.value = 'Ready to process.';
      }
  } catch (err) {
    statusMsg.value = `Error picking file: ${err}`;
  }
}

async function processImage() {
  if (!originalPath.value) return;

  isProcessing.value = true;
  statusMsg.value = 'Processing...';

  try {
    const resultPath: string = await invoke('remove_watermark', { filePath: originalPath.value });
    cleanPath.value = resultPath;
    
    // Load the processed image from disk
    cleanImage.value = await loadFileToBlob(resultPath);
    
    statusMsg.value = 'Done! Saved to ' + resultPath;
  } catch (err) {
    statusMsg.value = `Error: ${err}`;
  } finally {
    isProcessing.value = false;
  }
}
</script>

<template>
  <div class="container">
    <div class="controls">
      <button @click="selectFile" class="btn primary">Select Image</button>
      <button @click="processImage" :disabled="!originalPath || isProcessing" class="btn success">
        {{ isProcessing ? 'Processing...' : 'Remove Watermark' }}
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
