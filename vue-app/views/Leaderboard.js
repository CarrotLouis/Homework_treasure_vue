(function() {
  window.Leaderboard = {
    name: 'Leaderboard',
    setup() {
      const { ref, computed } = Vue;
      const gameStore = window.useGameStore();
      const activeTab = ref('recent');
      
      const sortedByScore = computed(() => {
        return [...gameStore.gameHistory].sort((a, b) => b.score - a.score).slice(0, 20);
      });
      
      const sortedByGold = computed(() => {
        return [...gameStore.gameHistory].sort((a, b) => b.gold - a.gold).slice(0, 20);
      });
      
      function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', { 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      
      return {
        gameStore,
        activeTab,
        sortedByScore,
        sortedByGold,
        formatDate
      };
    },
    template: `
      <div class="leaderboard container">
        <h2>🏆 排行榜</h2>
        
        <div style="display: flex; gap: 10px; margin-bottom: 30px; justify-content: center;">
          <button 
            :style="{ background: activeTab === 'recent' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 25px', border: 'none', borderRadius: '8px', cursor: 'pointer' }"
            @click="activeTab = 'recent'"
          >
            最近游戏
          </button>
          <button 
            :style="{ background: activeTab === 'score' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 25px', border: 'none', borderRadius: '8px', cursor: 'pointer' }"
            @click="activeTab = 'score'"
          >
            最高分榜
          </button>
          <button 
            :style="{ background: activeTab === 'gold' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 25px', border: 'none', borderRadius: '8px', cursor: 'pointer' }"
            @click="activeTab = 'gold'"
          >
            金币榜
          </button>
        </div>
        
        <div v-if="activeTab === 'recent'" style="display: flex; flex-direction: column; gap: 10px;">
          <div v-if="gameStore.recentGames.length === 0" style="text-align: center; padding: 40px; color: #888;">
            还没有游戏记录
          </div>
          <div v-for="(game, index) in gameStore.recentGames" :key="game.id" 
               style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.3); border-radius: 8px;">
            <span style="color: #ffd700; font-weight: bold; min-width: 40px;">#{{ index + 1 }}</span>
            <span style="color: #eee; flex: 1;">{{ game.playerName || '冒险者' }}</span>
            <span style="color: #4CAF50; font-weight: bold;">💰 {{ game.gold }}</span>
            <span style="color: #ddd; margin-left: 15px;">⭐ Lv.{{ game.level }}</span>
            <span style="color: #aaa; margin-left: 15px; font-size: 12px;">{{ formatDate(game.completedAt) }}</span>
          </div>
        </div>
        
        <div v-if="activeTab === 'score'" style="display: flex; flex-direction: column; gap: 10px;">
          <div v-if="sortedByScore.length === 0" style="text-align: center; padding: 40px; color: #888;">
            还没有游戏记录
          </div>
          <div v-for="(game, index) in sortedByScore" :key="game.id" 
               :style="{ 
                 display: 'flex', 
                 justifyContent: 'space-between', 
                 alignItems: 'center', 
                 padding: '15px 20px', 
                 background: index < 3 ? 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1))' : 'rgba(255,255,255,0.05)', 
                 border: '1px solid ' + (index < 3 ? '#ffd700' : 'rgba(255,215,0,0.3)'), 
                 borderRadius: '8px' 
               }"
          >
            <span style="font-size: 24px; min-width: 50px;">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1) }}</span>
            <span style="color: #eee; flex: 1;">{{ game.playerName || '冒险者' }}</span>
            <span style="color: #ff9800; font-weight: bold; font-size: 20px;">🏆 {{ game.score }}</span>
            <span style="color: #aaa; margin-left: 15px; font-size: 12px;">{{ formatDate(game.completedAt) }}</span>
          </div>
        </div>
        
        <div v-if="activeTab === 'gold'" style="display: flex; flex-direction: column; gap: 10px;">
          <div v-if="sortedByGold.length === 0" style="text-align: center; padding: 40px; color: #888;">
            还没有游戏记录
          </div>
          <div v-for="(game, index) in sortedByGold" :key="game.id" 
               :style="{ 
                 display: 'flex', 
                 justifyContent: 'space-between', 
                 alignItems: 'center', 
                 padding: '15px 20px', 
                 background: index < 3 ? 'linear-gradient(135deg, rgba(76,175,80,0.2), rgba(76,175,80,0.1))' : 'rgba(255,255,255,0.05)', 
                 border: '1px solid ' + (index < 3 ? '#4CAF50' : 'rgba(255,215,0,0.3)'), 
                 borderRadius: '8px' 
               }"
          >
            <span style="font-size: 24px; min-width: 50px;">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1) }}</span>
            <span style="color: #eee; flex: 1;">{{ game.playerName || '冒险者' }}</span>
            <span style="color: #4CAF50; font-weight: bold; font-size: 20px;">💰 {{ game.gold }}</span>
            <span style="color: #aaa; margin-left: 15px; font-size: 12px;">{{ formatDate(game.completedAt) }}</span>
          </div>
        </div>
      </div>
    `
  };
})();
