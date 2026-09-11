<script setup lang="ts">
  import LogoSvg from "@/components/b-logo/index.vue"

  const bannerTitle = "JetBrains"
</script>

<template>
  <div class="banner-title">
    <LogoSvg :width="40" :height="40" />
    {{bannerTitle}}
  </div>
</template>

<style scoped lang="scss">
.banner-title {
  position: absolute;
  display: flex;
  top: 30px;
  left: 30px;
  column-gap: 8px;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: blueviolet;
}
</style>