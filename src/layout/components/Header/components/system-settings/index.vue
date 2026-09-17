<script setup lang="ts">
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {Check} from "@element-plus/icons-vue";

const settingsStore = useSettingsStoreHook();

const visible = ref(false);

/** 打开抽屉 */
const open = () => {
    visible.value = true;
};

defineExpose({open});

/* ---------- 界面设置项（除菜单折叠单独处理） ---------- */
type BooleanKey = "menuAccordion" | "showBreadcrumb" | "showTabs" | "showFooter";
const interfaceItems = computed<{ key: BooleanKey; labelKey: string }[]>(() => [
    {key: "menuAccordion", labelKey: "system.menu-accordion"},
    {key: "showBreadcrumb", labelKey: "system.breadcrumb"},
    {key: "showTabs", labelKey: "system.tab-bar"},
    {key: "showFooter", labelKey: "system.page-footer"},
]);

/* ---------- 菜单布局可选项 ---------- */
const menuLayoutOptions = [
    {value: "side", labelKey: "system.menu-layout-side"},
    {value: "top", labelKey: "system.menu-layout-top"},
    {value: "mix", labelKey: "system.menu-layout-mix"},
] as const;

/* ---------- 主题设置：页面过渡可选项 ---------- */
const pageTransitionOptions = [
    {value: "light", labelKey: "system.transition-light"},
    {value: "card", labelKey: "system.transition-card"},
    {value: "fade", labelKey: "system.transition-fade"},
] as const;

/* ---------- 页签风格可选项（灵动 / 卡片 / 谷歌） ---------- */
const tabStyleOptions = [
    {value: "smart", labelKey: "system.tab-style-smart"},
    {value: "card", labelKey: "system.tab-style-card"},
    {value: "google", labelKey: "system.tab-style-google"},
] as const;
</script>

<template>
  <el-drawer
      v-model="visible"
      :title="$t('system.system-settings')"
      direction="rtl"
      size="340px"
      class="system-settings-drawer"
  >
    <div class="settings-body">
      <!-- 菜单布局 -->
      <div class="section">
        <div class="section-title">{{ $t("system.menu-layout") }}</div>
        <div class="layout-row">
          <div
              v-for="opt in menuLayoutOptions"
              :key="opt.value"
              class="layout-item"
              :class="{ 'is-active': settingsStore.menuLayout === opt.value }"
              @click="settingsStore.menuLayout = opt.value"
          >
            <!-- 布局示意图 -->
            <div class="layout-thumb" :class="'thumb-' + opt.value">
              <span class="thumb-dark"></span>
              <span class="thumb-light"></span>
            </div>
            <span class="layout-label">{{ $t(opt.labelKey) }}</span>
            <!-- 选中标记 -->
            <span v-if="settingsStore.menuLayout === opt.value" class="layout-check">
              <el-icon><Check/></el-icon>
            </span>
          </div>
        </div>
      </div>

      <!-- 主题设置 -->
      <div class="section">
        <div class="section-title">{{ $t("system.theme-settings") }}</div>
        <!-- 主题色：实时写 store，store 内 watch 会即时更新全局 --el-color-primary -->
        <div class="setting-row">
          <span class="label">{{ $t("system.theme-color") }}</span>
          <el-color-picker v-model="settingsStore.themeColor" show-alpha/>
        </div>
        <!-- 色弱模式：html 加 color-weak class -->
        <div class="setting-row">
          <span class="label">{{ $t("system.color-weakness-mode") }}</span>
          <el-switch v-model="settingsStore.colorWeak"/>
        </div>
        <!-- 灰色模式：html 加 grey-mode class -->
        <div class="setting-row">
          <span class="label">{{ $t("system.grey-mode") }}</span>
          <el-switch v-model="settingsStore.greyMode"/>
        </div>
        <!-- 侧边栏深色：Aside 切换深色背景 -->
        <div class="setting-row">
          <span class="label">{{ $t("system.sidebar-dark") }}</span>
          <el-switch v-model="settingsStore.sidebarDark"/>
        </div>
        <!-- 页面过渡：路由切换动画 -->
        <div class="setting-row">
          <span class="label">{{ $t("system.page-transition") }}</span>
          <el-select
              v-model="settingsStore.pageTransition"
              size="small"
              class="row-select"
          >
            <el-option
                v-for="opt in pageTransitionOptions"
                :key="opt.value"
                :value="opt.value"
                :label="$t(opt.labelKey)"
            />
          </el-select>
        </div>
      </div>

      <!-- 界面设置 -->
      <div class="section">
        <div class="section-title">{{ $t("system.interface-settings") }}</div>
        <div class="setting-row">
          <span class="label">{{ $t("system.menu-folding") }}</span>
          <el-switch v-model="settingsStore.isCollapse"/>
        </div>
        <div
            v-for="item in interfaceItems"
            :key="item.key"
            class="setting-row"
        >
          <span class="label">{{ $t(item.labelKey) }}</span>
          <el-switch v-model="settingsStore[item.key]"/>
        </div>
        <!-- 页签风格：标签栏关闭时一并隐藏，避免改了看不见 -->
        <div v-if="settingsStore.showTabs" class="setting-row">
          <span class="label">{{ $t("system.tab-style") }}</span>
          <el-radio-group v-model="settingsStore.tabStyle" size="small">
            <el-radio-button
                v-for="opt in tabStyleOptions"
                :key="opt.value"
                :value="opt.value"
            >
              {{ $t(opt.labelKey) }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 水印设置 -->
      <div class="section">
        <div class="section-title">{{ $t("system.watermark-settings") }}</div>
        <div class="setting-row">
          <span class="label">{{ $t("system.watermark-color") }}</span>
          <!--
            用 :model-value 单向绑定当前值，@active-change 在拖动/调透明度时实时触发，
            直接写 store，无需点 OK 即可实时预览（v-model 只在点确定时更新，不符合实时要求）
          -->
          <el-color-picker
              :model-value="settingsStore.watermark.color"
              show-alpha
              @active-change="(c: string | null) => settingsStore.watermark.color = c ?? ''"
          />
        </div>
        <div class="setting-row">
          <span class="label">{{ $t("system.watermark-text") }}</span>
          <el-input
              v-model="settingsStore.watermark.text"
              :placeholder="$t('system.please-enter-something')"
              size="small"
              class="row-input"
              clearable
          />
        </div>
        <div class="setting-row">
          <span class="label">{{ $t("system.watermark-size") }}</span>
          <el-slider v-model="settingsStore.watermark.size" :min="10" :max="40" class="row-slider"/>
        </div>
        <div class="setting-row">
          <span class="label">{{ $t("system.watermark-angle") }}</span>
          <el-slider v-model="settingsStore.watermark.angle" :min="-90" :max="90" class="row-slider"/>
        </div>
        <div class="setting-row">
          <span class="label">{{ $t("system.watermark-gap") }}</span>
          <el-slider v-model="settingsStore.watermark.gap" :min="0" :max="400" :step="10" class="row-slider"/>
        </div>
      </div>

      <!-- 系统设置 -->
      <div class="section">
        <div class="section-title">{{ $t("system.system-settings") }}</div>
        <div class="setting-row">
          <span class="label">{{ $t("system.anti-debugging") }}</span>
          <el-switch v-model="settingsStore.antiDebug"/>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.settings-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 4px;
}

.section {
  .section-title {
    margin-bottom: 12px;
    padding-left: 8px;
    border-left: 3px solid var(--el-color-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    color: var(--el-text-color-primary);
  }
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;

  .label {
    flex-shrink: 0;
    margin-right: 12px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    white-space: nowrap;
  }

  .row-input {
    width: 160px;
  }

  .clear-icon {
    cursor: pointer;
    color: var(--el-text-color-placeholder);
    transition: color 0.2s;

    &:hover {
      color: var(--el-color-danger);
    }
  }

  .row-slider {
    width: 160px;
  }

  .row-select {
    width: 120px;
  }
}

/* ---------- 菜单布局选择 ---------- */
.layout-row {
  display: flex;
  gap: 12px;
}

.layout-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
  }

  .layout-label {
    font-size: 12px;
    color: var(--el-text-color-regular);
    white-space: nowrap;
  }

  /* 选中标记：右下角蓝色圆形勾 */
  .layout-check {
    position: absolute;
    right: 6px;
    bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: var(--el-color-primary);
    color: #fff;
    font-size: 10px;
  }
}

/* 布局示意图：用 span 拼出迷你布局结构 */
.layout-thumb {
  position: relative;
  width: 56px;
  height: 40px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--el-bg-color);

  .thumb-dark {
    position: absolute;
    background-color: var(--el-text-color-primary);
  }

  .thumb-light {
    position: absolute;
    background-color: var(--el-fill-color-light);
  }

  /* 左侧菜单：左侧竖向深色 + 顶部浅色条 */
  &.thumb-side {
    .thumb-dark { left: 0; top: 0; bottom: 0; width: 16px; }
    .thumb-light { left: 16px; top: 0; right: 0; height: 10px; }
  }

  /* 顶部菜单：顶部横向深色 */
  &.thumb-top {
    .thumb-dark { left: 0; top: 0; right: 0; height: 12px; }
  }

  /* 混合菜单：顶部横向深色 + 左侧竖向深色 */
  &.thumb-mix {
    .thumb-dark { left: 0; top: 0; right: 0; height: 12px; }
    .thumb-light {
      left: 0; top: 12px; bottom: 0; width: 14px;
      background-color: var(--el-text-color-primary);
    }
  }
}
</style>

<!-- 非 scoped 样式：el-drawer 内容会被 teleport 到 body，scoped 样式无法穿透，
     通过自定义 class system-settings-drawer 限定范围，避免污染全局其他抽屉 -->
<style lang="scss">
.system-settings-drawer {
  .el-drawer__header {
    margin-bottom: 0;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}
</style>
