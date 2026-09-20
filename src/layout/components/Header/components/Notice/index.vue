<script setup lang="ts">
import {Bell} from "@element-plus/icons-vue";

interface NoticeItem {
    id: number;
    title: string;
    type: "notice" | "message" | "backlog";
}

// mock 通知数据：Header 通知弹层使用，后续接接口时可替换为接口返回的数据
const notices = ref<NoticeItem[]>([
    {id: 1, title: "系统将于今晚 23:00 进行维护升级", type: "notice"},
    {id: 2, title: "您有一条新的审批待办", type: "backlog"},
    {id: 3, title: "管理员给您发来一条消息", type: "message"},
]);

const count = computed(() => notices.value.length);

// tab 分类：控制通知弹层里的“通知 / 消息 / 待办”三个页签
const activeTab = ref("notice");
const tabs = [
    {key: "notice", label: "system.notice"},
    {key: "message", label: "system.message"},
    {key: "backlog", label: "system.backlog"},
];

const filtered = computed(() =>
    notices.value.filter(n => n.type === activeTab.value)
);
</script>

<template>
  <el-popover placement="bottom-end" :width="320" trigger="click">
    <template #reference>
      <div class="notice-trigger">
        <el-badge :value="count" :hidden="count === 0" :max="99">
          <el-icon :size="18"><Bell/></el-icon>
        </el-badge>
      </div>
    </template>

    <el-tabs v-model="activeTab" class="notice-tabs">
      <el-tab-pane
          v-for="tab in tabs"
          :key="tab.key"
          :label="$t(tab.label)"
          :name="tab.key"
      >
        <div class="notice-list">
          <div v-if="filtered.length === 0" class="notice-empty">
            {{ $t("system.notice") }}
          </div>
          <div v-for="item in filtered" :key="item.id" class="notice-item">
            {{ item.title }}
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-popover>
</template>

<style scoped lang="scss">
/* ==================== 通知入口按钮开始 ====================
 * 控制位置：Header 右侧铃铛图标区域 .notice-trigger。
 * 内部使用 el-badge 显示未读数量，点击后打开 el-popover。
 * 修改这里会影响：铃铛按钮尺寸、hover 背景和点击区域。
 */
.notice-trigger {
  /* 铃铛图标居中 */
  display: flex;
  align-items: center;
  justify-content: center;
  /* 与 HeaderRight 里其他 action-item 保持同样尺寸 */
  width: 22px;
  height: 22px;
  /* 鼠标手势提示可点击 */
  cursor: pointer;
  /* hover 背景过渡 */
  transition: background-color 0.2s;

  /* 铃铛按钮 hover 背景 */
  &:hover {
    background-color: var(--el-fill-color-light);
  }
}
/* ==================== 通知入口按钮结束 ==================== */

/* ==================== 通知弹层页签开始 ====================
 * 控制位置：Popover 内的 el-tabs，也就是通知、消息、待办的分类页签。
 * 修改这里会影响：页签头部和通知列表之间的间距。
 */
.notice-tabs {
  /* 覆盖 Element Plus tabs 头部默认 margin，让弹层更紧凑 */
  :deep(.el-tabs__header) {
    margin: 0 0 8px;
  }
}
/* ==================== 通知弹层页签结束 ==================== */

/* ==================== 通知列表开始 ====================
 * 控制位置：Popover 中当前 tab 下的通知列表。
 * 修改这里会影响：列表最大高度、内部滚动、单条通知间距、空状态样式。
 */
.notice-list {
  /* 通知过多时限制弹层高度 */
  max-height: 280px;
  /* 超出最大高度后在弹层内部滚动 */
  overflow-y: auto;

  /* 单条通知项 */
  .notice-item {
    padding: 8px 4px;
    font-size: 13px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  /* 当前分类没有通知时的空状态 */
  .notice-empty {
    padding: 24px 0;
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}
/* ==================== 通知列表结束 ==================== */
</style>
