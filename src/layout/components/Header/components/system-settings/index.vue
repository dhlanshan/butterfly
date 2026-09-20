<script setup lang="ts">
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {Check} from "@element-plus/icons-vue";

const settingsStore = useSettingsStoreHook();

const visible = ref(false);

/** 打开系统设置抽屉：由 HeaderRight 通过 ref 调用 */
const open = () => {
    visible.value = true;
};

defineExpose({open});

/* ---------- 界面设置项开始 ----------
 * 控制位置：设置抽屉“界面设置”区域中批量渲染的开关。
 * 不包含“菜单折叠”，因为菜单折叠绑定的是 settingsStore.isCollapse，单独写在 template 里。
 * ---------- 界面设置项结束 ---------- */
type BooleanKey = "menuAccordion" | "showBreadcrumb" | "showTabs" | "showFooter";
const interfaceItems = computed<{ key: BooleanKey; labelKey: string }[]>(() => [
    {key: "menuAccordion", labelKey: "system.menu-accordion"},
    {key: "showBreadcrumb", labelKey: "system.breadcrumb"},
    {key: "showTabs", labelKey: "system.tab-bar"},
    {key: "showFooter", labelKey: "system.page-footer"},
]);

/* ---------- 菜单布局可选项开始 ----------
 * 控制位置：设置抽屉顶部“菜单布局”三张示意卡。
 * value 对应 settingsStore.menuLayout：side / top / mix。
 * ---------- 菜单布局可选项结束 ---------- */
const menuLayoutOptions = [
    {value: "side", labelKey: "system.menu-layout-side"},
    {value: "top", labelKey: "system.menu-layout-top"},
    {value: "mix", labelKey: "system.menu-layout-mix"},
] as const;

/* ---------- 页面过渡可选项开始 ----------
 * 控制位置：主题设置区域的“页面过渡”下拉框。
 * value 对应 Main/index.vue 中 transitionName 拼出的 CSS 动画名称。
 * ---------- 页面过渡可选项结束 ---------- */
const pageTransitionOptions = [
    {value: "light", labelKey: "system.transition-light"},
    {value: "card", labelKey: "system.transition-card"},
    {value: "fade", labelKey: "system.transition-fade"},
] as const;

/* ---------- 页签风格可选项开始 ----------
 * 控制位置：界面设置区域的“页签风格”单选按钮组。
 * value 对应 Tabs/index.vue 中 settingsStore.tabStyle 的样式分支。
 * ---------- 页签风格可选项结束 ---------- */
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
        <!-- 页签风格 / 拖动：标签栏关闭时一并隐藏，避免改了看不见 -->
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
        <div v-if="settingsStore.showTabs" class="setting-row">
          <span class="label">{{ $t("system.tab-drag") }}</span>
          <el-switch v-model="settingsStore.tabDrag"/>
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
/* ==================== 设置抽屉内容主体开始 ====================
 * 控制位置：el-drawer 内部的 .settings-body。
 * 修改这里会影响：各设置分区的纵向排列、分区间距、抽屉内容左右留白。
 */
.settings-body {
  /* 各 section 纵向排列 */
  display: flex;
  flex-direction: column;
  /* 每个设置分区之间的距离 */
  gap: 24px;
  /* 抽屉内容左右微调留白 */
  padding: 0 4px;
}
/* ==================== 设置抽屉内容主体结束 ==================== */

/* ==================== 设置分区标题开始 ====================
 * 控制位置：每个 .section 内的 .section-title，例如“菜单布局”“主题设置”。
 * 修改这里会影响：分区标题间距、左侧主色竖线、字号、字重、颜色。
 */
.section {
  .section-title {
    /* 标题和本分区第一行内容之间的距离 */
    margin-bottom: 12px;
    /* 标题文字左侧内边距，给左侧竖线留空间 */
    padding-left: 8px;
    /* 左侧主色竖线 */
    border-left: 3px solid var(--el-color-primary);
    /* 标题字号 */
    font-size: 14px;
    /* 标题字重 */
    font-weight: 600;
    /* 标题行高压紧，避免 section 标题过高 */
    line-height: 1;
    /* 标题文字颜色，跟随主题 */
    color: var(--el-text-color-primary);
  }
}
/* ==================== 设置分区标题结束 ==================== */

/* ==================== 通用设置行开始 ====================
 * 控制位置：设置抽屉里左右布局的每一行 .setting-row。
 * 左侧通常是 .label，右侧通常是 switch / select / input / slider / color-picker。
 * 修改这里会影响：所有设置行高度、左右对齐、控件宽度。
 */
.setting-row {
  /* label 和控件横向排列 */
  display: flex;
  /* label 和控件垂直居中 */
  align-items: center;
  /* label 靠左、控件靠右 */
  justify-content: space-between;
  /* 每一行上下留白 */
  padding: 8px 0;

  /* 设置项左侧文字 */
  .label {
    /* 防止 label 被右侧控件压缩 */
    flex-shrink: 0;
    /* label 和控件之间的最小距离 */
    margin-right: 12px;
    /* label 字号 */
    font-size: 13px;
    /* label 文字颜色 */
    color: var(--el-text-color-regular);
    /* label 不换行，避免设置行变高 */
    white-space: nowrap;
  }

  /* 右侧短文本输入框宽度，例如水印文字 */
  .row-input {
    width: 160px;
  }

  /* 清除图标辅助样式：当前模板未直接使用，保留给可清空类控件扩展 */
  .clear-icon {
    cursor: pointer;
    color: var(--el-text-color-placeholder);
    transition: color 0.2s;

    &:hover {
      color: var(--el-color-danger);
    }
  }

  /* 右侧滑块宽度，例如水印大小、角度、间距 */
  .row-slider {
    width: 160px;
  }

  /* 右侧下拉框宽度，例如页面过渡 */
  .row-select {
    width: 120px;
  }
}
/* ==================== 通用设置行结束 ==================== */

/* ==================== 菜单布局选择行开始 ====================
 * 控制位置：“菜单布局”分区里包住三张布局卡片的 .layout-row。
 * 修改这里会影响：side / top / mix 三张卡片之间的横向间距。
 */
.layout-row {
  display: flex;
  gap: 12px;
}
/* ==================== 菜单布局选择行结束 ==================== */

/* ==================== 菜单布局选项卡片开始 ====================
 * 控制位置：单个菜单布局卡片 .layout-item。
 * 修改这里会影响：卡片尺寸感、边框、圆角、hover、选中阴影、布局文字和勾选标记。
 */
.layout-item {
  /* 给右下角选中标记提供定位上下文 */
  position: relative;
  /* 示意图和文字上下排列 */
  display: flex;
  flex-direction: column;
  /* 卡片内容居中 */
  align-items: center;
  /* 示意图和文字之间的距离 */
  gap: 6px;
  /* 卡片内边距 */
  padding: 8px;
  /* 默认边框 */
  border: 1px solid var(--el-border-color);
  /* 卡片圆角 */
  border-radius: 6px;
  /* 鼠标手势提示可点击 */
  cursor: pointer;
  /* hover / active 视觉变化过渡 */
  transition: border-color 0.2s, box-shadow 0.2s;

  /* 卡片 hover：边框变主色 */
  &:hover {
    border-color: var(--el-color-primary);
  }

  /* 当前选中的菜单布局卡片 */
  &.is-active {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
  }

  /* 卡片下方布局名称 */
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
/* ==================== 菜单布局选项卡片结束 ==================== */

/* ==================== 菜单布局示意图开始 ====================
 * 控制位置：菜单布局卡片里的 .layout-thumb。
 * 用 .thumb-dark 和 .thumb-light 两个 span 拼出 side / top / mix 的迷你结构图。
 * 修改这里会影响：布局预览图尺寸、颜色和三种布局的示意结构。
 */
.layout-thumb {
  /* 给内部深色/浅色块提供定位上下文 */
  position: relative;
  /* 示意图宽度 */
  width: 56px;
  /* 示意图高度 */
  height: 40px;
  /* 示意图边框 */
  border: 1px solid var(--el-border-color);
  /* 示意图圆角 */
  border-radius: 4px;
  /* 裁掉内部色块溢出，保持圆角 */
  overflow: hidden;
  /* 示意图底色 */
  background-color: var(--el-bg-color);

  /* 示意图中的深色区域，通常代表菜单栏 */
  .thumb-dark {
    position: absolute;
    background-color: var(--el-text-color-primary);
  }

  /* 示意图中的浅色区域，通常代表 Header 或侧栏之外的内容 */
  .thumb-light {
    position: absolute;
    background-color: var(--el-fill-color-light);
  }

  /* side 布局示意图：左侧竖向深色菜单 + 右侧顶部浅色 Header */
  &.thumb-side {
    .thumb-dark { left: 0; top: 0; bottom: 0; width: 16px; }
    .thumb-light { left: 16px; top: 0; right: 0; height: 10px; }
  }

  /* top 布局示意图：顶部横向深色菜单 */
  &.thumb-top {
    .thumb-dark { left: 0; top: 0; right: 0; height: 12px; }
  }

  /* mix 布局示意图：顶部横向深色菜单 + 左侧竖向深色子菜单 */
  &.thumb-mix {
    .thumb-dark { left: 0; top: 0; right: 0; height: 12px; }
    .thumb-light {
      left: 0; top: 12px; bottom: 0; width: 14px;
      background-color: var(--el-text-color-primary);
    }
  }
}
/* ==================== 菜单布局示意图结束 ==================== */
</style>

<!-- 非 scoped 样式：el-drawer 内容会被 teleport 到 body，scoped 样式无法穿透，
     通过自定义 class system-settings-drawer 限定范围，避免污染全局其他抽屉 -->
<style lang="scss">
/* ==================== 系统设置抽屉非 scoped 样式开始 ====================
 * 控制位置：Element Plus teleport 到 body 下的 .system-settings-drawer。
 * 为什么不 scoped：el-drawer 的实际 DOM 不在当前组件 scoped 范围内，scoped 选择器匹配不到。
 * 修改这里会影响：系统设置抽屉头部间距和底部分隔线。
 */
.system-settings-drawer {
  /* 抽屉头部：标题区域和内容区域之间的间距/分隔线 */
  .el-drawer__header {
    margin-bottom: 0;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}
/* ==================== 系统设置抽屉非 scoped 样式结束 ==================== */
</style>
