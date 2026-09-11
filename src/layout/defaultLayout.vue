<script setup lang="ts">
import Aside from "./components/Aside/index.vue"
import Main from "./components/Main/index.vue"
import Header from "./components/Header/index.vue"
import Tabs from "./components/Tabs/index.vue"
</script>

<template>
  <div class="common-layout">
    <el-container>
      <Aside />
      <el-container direction="vertical">
        <Header />
        <Tabs />
        <Main />
      </el-container>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.common-layout {
  height: 100vh;
  overflow: hidden;
}
</style>
