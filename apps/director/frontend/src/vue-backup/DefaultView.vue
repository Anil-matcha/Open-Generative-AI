<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { ChatInterface } from "@videodb/chat-vue";
import "@videodb/chat-vue/dist/style.css";

const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;
const chatInterfaceRef = ref(null);

const handleKeyDown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "k") {
    event.preventDefault();
    chatInterfaceRef.value.createNewSession();
    chatInterfaceRef.value.chatInputRef.focus();
  }
};
onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <main>
    <chat-interface
      ref="chatInterfaceRef"
      :chat-hook-config="{
        socketUrl: `${BACKEND_URL}/chat`,
        httpUrl: `${BACKEND_URL}`,
        debug: true,
      }"
    />
  </main>
</template>

<style>
:root {
  --popper-theme-background-color: #333333;
  --popper-theme-background-color-hover: #333333;
  --popper-theme-text-color: #ffffff;
  --popper-theme-border-width: 0px;
  --popper-theme-border-style: solid;
  --popper-theme-border-radius: 8px;
  --popper-theme-padding: 4px 8px;
  --popper-theme-box-shadow: 0px 6px 6px rgba(0, 0, 0, 0.08);
}

.template {
  height: 100vh;
  width: 100vw;
}

main {
  overflow: scroll;
  height: 100%;
}
html {
  overflow: hidden;
}

/* For WebKit-based browsers (Chrome, Safari) */
::-webkit-scrollbar {
  width: 12px; /* Width of the scrollbar */
}

::-webkit-scrollbar-track {
  background: #f1f1f1; /* Background of the scrollbar track */
}

::-webkit-scrollbar-thumb {
  background-color: #888; /* Scrollbar thumb color */
  border-radius: 6px; /* Rounded corners */
  border: 3px solid #f1f1f1; /* Space around the thumb */
}

::-webkit-scrollbar-thumb:hover {
  background-color: #555; /* Thumb color on hover */
}

/* For Mozilla Firefox */
* {
  scrollbar-width: thin; /* Makes the scrollbar narrower */
  scrollbar-color: #888 #f1f1f1; /* Thumb and track colors */
}
</style>
