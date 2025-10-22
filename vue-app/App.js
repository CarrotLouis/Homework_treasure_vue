(function() {
  window.App = {
    name: 'App',
    setup() {
      const { computed } = Vue;
      const gameStore = window.useGameStore();
      
      return { gameStore };
    },
    template: `
      <div id="app">
        <header class="header">
          <h1>🏴‍☠️ 寻宝冒险游戏 Plus</h1>
          <nav class="nav">
            <router-link to="/" class="nav-link">🎮 游戏</router-link>
            <router-link to="/users" class="nav-link">👥 用户管理</router-link>
            <router-link to="/leaderboard" class="nav-link">🏆 排行榜</router-link>
          </nav>
        </header>
        
        <main class="main-content">
          <router-view />
        </main>
        
        <footer class="footer">
          <p>© 2024 寻宝冒险游戏 Plus - Vue 3 版本 | 基于原版游戏重构并增强</p>
        </footer>
      </div>
    `
  };
})();
