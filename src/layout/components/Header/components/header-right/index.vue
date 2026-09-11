<script setup lang="ts">
import {useRouter} from "vue-router";
import {ElMessage, ElMessageBox} from "element-plus";
import {
    Sunny, Moon, FullScreen, Aim, Setting, Brush, ArrowDown, SwitchButton, User, Lock,
} from "@element-plus/icons-vue";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useUserStoreHook} from "@/store/modules/user.ts";
import Notice from "../Notice/index.vue";
import {useI18n} from "vue-i18n";

const settingsStore = useSettingsStoreHook();
const userStore = useUserStoreHook();
const router = useRouter();
const {t, locale} = useI18n();

/* ---------- 全屏 ---------- */
const isFullscreen = ref(false);
const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        isFullscreen.value = true;
    } else {
        document.exitFullscreen();
        isFullscreen.value = false;
    }
};

/* ---------- 语言切换 ---------- */
const langList = [
    {value: "zh-CN", label: "system.zh-CN"},
    {value: "en-US", label: "system.en-US"},
];
const currentLang = ref<string>(locale.value);
const handleLang = (val: string) => {
    currentLang.value = val;
    locale.value = val;
    // 同步持久化到 theme-config（与 lang/index.ts 读取保持一致）
    const store = localStorage.getItem("theme-config");
    const cfg = store ? JSON.parse(store) : {};
    cfg.language = val;
    localStorage.setItem("theme-config", JSON.stringify(cfg));
};

/* ---------- 用户下拉 ---------- */
const handleCommand = async (cmd: string) => {
    if (cmd === "logout") {
        try {
            await ElMessageBox.confirm(
                t("system.logout") + "?",
                "提示",
                {type: "warning"}
            );
        } catch {
            return;
        }
        await userStore.logout();
        ElMessage.success(t("system.logout"));
        router.replace("/login");
    } else if (cmd === "personal") {
        ElMessage.info(t("system.personal-information"));
    } else if (cmd === "password") {
        ElMessage.info(t("system.change-password"));
    }
};
</script>

<template>
  <div class="header-right">
    <!-- 语言切换 -->
    <el-dropdown trigger="click" @command="handleLang">
      <div class="action-item">
        <span class="lang-text">文</span>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
              v-for="l in langList"
              :key="l.value"
              :command="l.value"
              :disabled="l.value === currentLang"
          >
            {{ $t(l.label) }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 主题（日/夜）切换 -->
    <div class="action-item" @click="settingsStore.toggleDark">
      <el-icon :size="18">
        <component :is="settingsStore.isDark ? Moon : Sunny"/>
      </el-icon>
      <el-tooltip
          :content="settingsStore.isDark
            ? $t('system.switch-to-daytime-mode')
            : $t('system.switch-to-night-mode')"
          placement="bottom"
      />
    </div>

    <!-- 通知 -->
    <Notice/>

    <!-- 全屏 -->
    <div class="action-item" @click="toggleFullscreen">
      <el-icon :size="18">
        <component :is="isFullscreen ? Aim : FullScreen"/>
      </el-icon>
      <el-tooltip
          :content="isFullscreen
            ? $t('system.exit-full-screen')
            : $t('system.full-screen')"
          placement="bottom"
      />
    </div>

    <!-- 系统设置 -->
    <div class="action-item">
      <el-icon :size="18"><Setting/></el-icon>
      <el-tooltip :content="$t('system.system-settings')" placement="bottom"/>
    </div>

    <!-- 主题设置（换肤） -->
    <div class="action-item">
      <el-icon :size="18"><Brush/></el-icon>
      <el-tooltip :content="$t('system.theme-settings')" placement="bottom"/>
    </div>

    <!-- 用户下拉 -->
    <el-dropdown trigger="click" @command="handleCommand">
      <div class="user-info">
        <el-avatar :size="32" :src="userStore.account.avatar || undefined">
          {{ userStore.account.nickname?.charAt(0) || "U" }}
        </el-avatar>
        <span v-show="!settingsStore.isMobile" class="username">{{ userStore.account.nickname || userStore.account.username || "User" }}</span>
        <el-icon class="arrow"><ArrowDown/></el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="personal">
            <el-icon><User/></el-icon>{{ $t("system.personal-information") }}
          </el-dropdown-item>
          <el-dropdown-item command="password">
            <el-icon><Lock/></el-icon>{{ $t("system.change-password") }}
          </el-dropdown-item>
          <el-dropdown-item divided command="logout">
            <el-icon><SwitchButton/></el-icon>{{ $t("system.logout") }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.header-right {
  display: flex;
  align-items: center;
  height: 100%;
  padding-right: 8px;

  .action-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 100%;
    cursor: pointer;
    color: var(--el-text-color-primary);
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }

    .lang-text {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 8px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    .username {
      margin: 0 4px 0 8px;
      font-size: 14px;
      color: var(--el-text-color-primary);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .arrow {
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
