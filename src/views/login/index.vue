<script setup lang="ts">
  import Logo from "./components/logo.vue"
  import LoginBanner from "./components/login-banner.vue";
  import LoginForm from "./components/login-form.vue";
</script>

<template>
  <div class="container">
    <Logo />
    <div class="login">
      <LoginBanner />
      <div class="login-box">
        <div class="login-title">Welcome Back</div>
        <div class="login-title-desc">国际化，路由配置，状态管理应有尽有</div>
        <div class="login-title-desc">丰富的的页面模板，覆盖大多数典型业务场景</div>
        <LoginForm />
      </div>
    </div>
    <!-- 版权信息和备案号 -->
    <div class="copyright-info" >
      <div class="copyright-text">哈哈哈</div>
      <div class="record-text" >7777</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background-image: url('@/assets/img/login-bg.jpg');
  /* 设置背景图 */
  background-size: cover;
  /* 覆盖整个容器 */
  background-position: center;
  /* 居中显示 */
  background-repeat: no-repeat;

  /* 不重复 */
  .login {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    align-items: center;
    max-width: 1000px;
    height: 500px;

    transform: translate(-50%, -50%);

    .login-box {
      position: relative;
      box-sizing: border-box;
      width: 350px;
      height: 100%;
      padding: 40px 30px 30px;
      box-shadow: 0 0 8px 1px #666666;
      background-color: #fff;

      .login-title {
        margin-bottom: 8px;
        font-size: 20px;
        color: #dddddd;
      }

      .login-title-desc {
        font-size: 12px;
        color: #666666;
      }

      .author {
        position: absolute;
        bottom: 30px;
        font-size: 12px;
        color: #666666;
      }
    }
  }


  .copyright-info {
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    text-align: center;
    padding: 0 20px;
    display: flex;
    justify-content: center;
    align-items: center;

    .copyright-text {
      font-size: 14px;
      color: #dddddd;
    }

    .record-text {
      margin-left: 5px;
      font-size: 14px;
      color: #666666;
    }
  }
  @media (max-width: 768px) {
    .copyright-info {
      flex-direction: column;

      .record-text {
        margin-left: 0;
        margin-top: 5px;
      }
    }
  }
}
</style>