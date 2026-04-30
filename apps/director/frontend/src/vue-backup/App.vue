<script setup>
import "./style.css";
import { DirectorLayout } from "./layout/DirectorLayout.vue";
</script>

<template>
  <DirectorLayout>
    <router-view />
  </DirectorLayout>
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


html {
  overflow: hidden;
}

</style>
