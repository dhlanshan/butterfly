<script setup lang="ts">
import {useRouter} from "vue-router";
import {ElMessage, ElMessageBox} from "element-plus";
import {
    Sunny, Moon, FullScreen, Aim, Setting, ArrowDown, SwitchButton, User, Lock,
} from "@element-plus/icons-vue";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useUserStoreHook} from "@/store/modules/user.ts";
import Notice from "../Notice/index.vue";
import SystemSettings from "../system-settings/index.vue";
import {useI18n} from "vue-i18n";
import {storageKey} from "@/utils/storage/keys.ts";

const settingsStore = useSettingsStoreHook();
const userStore = useUserStoreHook();
const router = useRouter();
const {t, locale} = useI18n();
const THEME_CONFIG_KEY = storageKey("theme-config");

// 偏好设置抽屉引用：点击 Header 右侧设置图标时调用子组件 open() 打开抽屉
const systemSettingsRef = ref();
const openSystemSettings = () => {
    systemSettingsRef.value?.open();
};

/* ---------- 全屏功能开始 ----------
 * 控制位置：Header 右侧全屏按钮。
 * isFullscreen 只记录当前按钮图标状态；真正的浏览器全屏由 Fullscreen API 控制。
 * 点击后在进入全屏和退出全屏之间切换。
 * ---------- 全屏功能结束 ---------- */
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

/* ---------- 语言切换开始 ----------
 * 控制位置：Header 右侧“文”下拉菜单。
 * langList 控制下拉选项；handleLang 负责切换 vue-i18n locale、html lang、localStorage 持久化。
 * 修改这里会影响：可切换语言列表、当前语言禁用状态、刷新后语言恢复。
 * ---------- 语言切换结束 ---------- */
const langList = [
    {value: "zh-CN", label: "system.zh-CN"},
    {value: "en-US", label: "system.en-US"},
];
const currentLang = ref<string>(locale.value);
const handleLang = (val: string) => {
    currentLang.value = val;
    locale.value = val;
    document.documentElement.lang = val;
    // 同步持久化到当前项目命名空间下的 theme-config（与 lang/index.ts 读取保持一致）
    const store = localStorage.getItem(THEME_CONFIG_KEY);
    const cfg = store ? JSON.parse(store) : {};
    cfg.language = val;
    localStorage.setItem(THEME_CONFIG_KEY, JSON.stringify(cfg));
};

/* ---------- 用户下拉菜单开始 ----------
 * 控制位置：Header 右侧头像/用户名下拉。
 * command 值来自 template 中 el-dropdown-item 的 command。
 * logout 会弹确认框、调用 userStore.logout()，然后跳转登录页。
 * personal/password 当前只提示消息，后续如接入页面可在这里改跳转逻辑。
 * ---------- 用户下拉菜单结束 ---------- */
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
        <svg
            class="lang-icon"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="img"
            viewBox="0 0 24 24"
        >
          <path
              fill="currentColor"
              d="m12.87 15.07l-2.54-2.51l.03-.03A17.5 17.5 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35C8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5l3.11 3.11zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2zm-2.62 7l1.62-4.33L19.12 17z"
          />
        </svg>
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

    <!-- 偏好设置 -->
    <div class="action-item" @click="openSystemSettings">
      <el-icon :size="18"><Setting/></el-icon>
      <el-tooltip :content="$t('system.preference-settings')" placement="bottom"/>
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

  <!-- 偏好设置抽屉 -->
  <SystemSettings ref="systemSettingsRef"/>
</template>

<style scoped lang="scss">
/* ==================== Header 右侧操作区开始 ====================
 * 控制位置：Header 最右侧 .header-right。
 * 内部包含：语言切换、日夜主题、通知、全屏、系统设置、用户下拉。
 * 修改这里会影响：右侧操作区整体排列、图标间距、右侧留白。
 */
.header-right {
  /* 图标和用户信息横向排列 */
  display: flex;
  /* 操作项在 Header 内垂直居中 */
  align-items: center;
  /* 撑满 Header 高度，让用户区可整高点击 */
  height: 100%;
  /* 右侧距离浏览器边缘的留白 */
  padding-right: 8px;
  /* 各操作项之间的横向间距 */
  gap: 16px;

  /* ==================== Header 图标按钮开始 ====================
   * 控制位置：语言、主题、全屏、系统设置等小图标按钮。
   * 修改这里会影响：图标按钮尺寸、hover 背景、图标颜色和鼠标手势。
   */
  .action-item {
    /* 给内部 tooltip 或未来角标预留定位上下文 */
    position: relative;
    /* 图标水平、垂直居中 */
    display: flex;
    align-items: center;
    justify-content: center;
    /* 图标按钮固定尺寸 */
    width: 22px;
    height: 22px;
    /* 鼠标手势提示可点击 */
    cursor: pointer;
    /* 默认图标颜色，跟随主题 */
    color: var(--el-text-color-primary);
    /* hover 背景过渡 */
    transition: background-color 0.2s;

    /* 图标按钮 hover 态：浅色填充背景 + 主色图标 */
    &:hover {
      background-color: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }

    /* 语言切换按钮图标：使用 currentColor，跟随 action-item 默认色和 hover 主色 */
    .lang-icon {
      width: 18px;
      height: 18px;
      display: block;
    }
  }
  /* ==================== Header 图标按钮结束 ==================== */

  /* ==================== 用户信息下拉入口开始 ====================
   * 控制位置：Header 右侧头像、用户名、下拉箭头。
   * 修改这里会影响：用户入口点击区域、用户名截断宽度、箭头颜色。
   */
  .user-info {
    /* 头像、用户名、箭头横向排列 */
    display: flex;
    /* 垂直居中 */
    align-items: center;
    /* 高度撑满 Header，扩大点击区域 */
    height: 100%;
    /* 用户区左右内边距 */
    padding: 0 8px;
    /* 鼠标手势提示可点击 */
    cursor: pointer;

    /* 用户名文本：移动端通过 template v-show 隐藏 */
    .username {
      margin: 0 4px 0 8px;
      font-size: 14px;
      color: var(--el-text-color-primary);
      /* 用户名最长显示宽度，过长时省略 */
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* 用户名右侧下拉箭头颜色 */
    .arrow {
      color: var(--el-text-color-secondary);
    }
  }
  /* ==================== 用户信息下拉入口结束 ==================== */
}
/* ==================== Header 右侧操作区结束 ==================== */
</style>
