<script setup lang="ts">
import {Bell} from "@element-plus/icons-vue";

interface NoticeItem {
    id: number;
    title: string;
    type: "notice" | "message" | "backlog";
}

// mock 通知数据
const notices = ref<NoticeItem[]>([
    {id: 1, title: "系统将于今晚 23:00 进行维护升级", type: "notice"},
    {id: 2, title: "您有一条新的审批待办", type: "backlog"},
    {id: 3, title: "管理员给您发来一条消息", type: "message"},
]);

const count = computed(() => notices.value.length);

// tab 分类
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
.notice-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 100%;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }
}

.notice-tabs {
  :deep(.el-tabs__header) {
    margin: 0 0 8px;
  }
}

.notice-list {
  max-height: 280px;
  overflow-y: auto;

  .notice-item {
    padding: 8px 4px;
    font-size: 13px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .notice-empty {
    padding: 24px 0;
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}
</style>
