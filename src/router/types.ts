// 转换后的路由结构接口
export interface ConvertedRouteItem {
    id: number;             // 菜单/路由唯一 id
    parentId: number;       // 父级菜单 id，0 表示顶层。后端返回的是扁平数组，靠 parentId 在前端拼成树
    path: string;           // 路由路径，浏览器地址栏的 URL
    name: string;           // 路由名称，代码里识别用（守卫判断、keep-alive 缓存匹配都靠它）
    component: string;      // 页面组件的「路径字符串」，不是组件本身。会被 moduleMatch 转成 () => import("@/views/...") 懒加载;注意 component：目录（type=1）的 component 是空字符串 ""（它没有页面，只做层级容器）；叶子（type=2）才有真实组件路径。
    redirect: string;       // 重定向目标，目录型路由（type=1）访问时自动跳到某个子页
    meta: {
        title: string;      // 标题的 i18n key（不是中文本身），渲染时 $t('menu.' + title)
        hide: boolean;      // 是否在菜单里隐藏（true=不显示在侧边栏，但仍可路由访问）
        disable: boolean;   // 菜单项是否禁用（灰显不可点）
        keepAlive: boolean; // 该页面是否需要 keep-alive 缓存
        affix: boolean;     // 标签是否固定（不可关闭，如首页）
        link: string;       // 外链 URL
        iframe: boolean;    // 是否用 iframe 内嵌这个 link（true=在系统内嵌iframe展示，false=新窗口打开）
        isFull: boolean;    // 是否全屏路由：true 时不套 layout，直接在 App.vue 顶层 RouterView 渲染（如独立大屏页）。
                            // 注意：与 iframe=true 当前互斥——iframe 渲染逻辑在 layout 内的 Main 组件里，
                            // isFull=true 会绕过 layout，导致 iframe 不显示（只渲染占位组件）。
                            // 需要「全屏内嵌外链」时，请用普通全屏页（iframe=false）承载自渲染内容，
                            // 或后续将 iframe 渲染抽成公共组件由顶层共用。
        roles: string[];    // 允许访问的角色编码数组（路由级权限）
        permission: string; // 按钮级权限标识码
        svgIcon: string;    // 自定义 SVG 图标名（不含 .svg），对应 src/assets/svgs/{name}.svg，
                            // 由 vite-plugin-svg-icons 注册为 #icon-{name}，菜单用 BSvgIcon 渲染。
                            // 与 icon 的优先级：svgIcon 非空则用自定义 SVG，不再看 icon。
        icon: string;       // Element Plus 图标组件名（如 Document、Setting）。仅当 svgIcon 为空时作为回退；
                            // 名称必须与 @element-plus/icons-vue 导出一致（PascalCase），无效名称不渲染。
        sort: number;       // 排序值，越小越靠前
        type: number;       // 菜单类型：1 = 目录（M，有子级、无页面）；2 = 菜单/页面（C，叶子、可跳转）
    };
    children: ConvertedRouteItem[] | null;
}