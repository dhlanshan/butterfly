<script setup lang="ts">
import LogoSvg from "@/components/b-logo/index.vue";

const bannerTitle = "JetBrains"
</script>

<template>
  <div class="logo_head">
    <div class="logo_box">
      <LogoSvg :width="32" :height="32" />
      <span class="logo_title">{{ bannerTitle }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
// 头部
.logo_head {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 60px;


  .logo_box {
    display: flex;
    // column-gap: $padding;
    align-items: center;
    width: 100%;
    padding: 0 16px;
    overflow: hidden;
  }

  // 折叠或者是横向布局-去掉padding，logo居中
  .padding-unset {
    justify-content: space-around;
    padding: unset;
  }

  .logo_title {
    box-sizing: border-box;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 16px;
    font-weight: bold;
    text-align: left;
    white-space: nowrap;
  }

  .dark {
    color: #ffffff;
  }
}

.no-border {
  border: unset;
}
</style>