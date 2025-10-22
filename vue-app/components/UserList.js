export default {
  name: 'UserList',
  props: {
    users: Array
  },
  emits: ['delete-user'],
  template: `
    <div class="user-list">
      <h3 style="color: #667eea; margin-bottom: 20px;">玩家列表 ({{ users.length }})</h3>
      <div v-if="users.length === 0" style="text-align: center; padding: 40px; color: #999; font-size: 18px;">
        暂无玩家，请添加新玩家
      </div>
      <div v-else style="display: grid; gap: 15px;">
        <div v-for="user in users" :key="user.id" 
             style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: white; border: 2px solid #e0e0e0; border-radius: 12px; transition: all 0.3s;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <span style="font-size: 48px;">{{ user.avatar }}</span>
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <div style="font-weight: bold; font-size: 18px; color: #333;">{{ user.name }}</div>
              <div style="display: flex; gap: 15px; font-size: 14px; color: #666;">
                <span>游戏: {{ user.gamesPlayed }}</span>
                <span>最高: {{ user.bestScore }}</span>
                <span>总分: {{ user.totalScore }}</span>
              </div>
            </div>
          </div>
          <button @click="$emit('delete-user', user.id)" 
                  style="background: #f44336; color: white; padding: 8px 15px; font-size: 20px;">
            🗑️
          </button>
        </div>
      </div>
    </div>
  `
};
