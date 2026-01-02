<script setup lang="ts">
import WatermarkRemover from "./components/WatermarkRemover.vue";
</script>

<template>
  <div class="container">
    <h1>Nano Banana Watermark Remover</h1>
    <p class="subtitle">Remove nano banana watermarks instantly.</p>
    
    <WatermarkRemover />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
}

.subtitle {
  color: #aaa;
  margin-bottom: 2rem;
  font-size: 1.2rem;
}
</style>