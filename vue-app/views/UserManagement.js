(function() {
  const UserList = {
    name: 'UserList',
    props: {
      users: Array
    },
    emits: ['delete-user', 'select-user'],
    template: `
      <div class="user-list">
        <h3 style="color: #ffd700; margin-bottom: 20px;">玩家列表 ({{ users.length }})</h3>
        <div v-if="users.length === 0" style="text-align: center; padding: 40px; color: #888; font-size: 18px;">
          暂无玩家，请添加新玩家
        </div>
        <div v-else style="display: grid; gap: 15px;">
          <div v-for="user in users" :key="user.id" 
               style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(255,255,255,0.08); border: 2px solid rgba(255,215,0,0.3); border-radius: 12px; transition: all 0.3s;">
            <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
              <span style="font-size: 48px;">👤</span>
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <div style="font-weight: bold; font-size: 18px; color: #ffd700;">{{ user.name }}</div>
                <div style="display: flex; gap: 15px; font-size: 14px; color: #ddd;">
                  <span>完成: {{ user.gamesCompleted }}</span>
                  <span>最高分: {{ user.bestScore }}</span>
                  <span>总金币: {{ user.totalGold }}</span>
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 10px;">
              <button @click="$emit('select-user', user)" 
                      style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 15px; font-size: 16px; border: none; border-radius: 8px; cursor: pointer;">
                🎮 使用
              </button>
              <button @click="$emit('delete-user', user.id)" 
                      style="background: #f44336; color: white; padding: 8px 15px; font-size: 20px; border: none; border-radius: 8px; cursor: pointer;">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  };

  window.UserManagement = {
    name: 'UserManagement',
    components: {
      UserList
    },
    setup() {
      const { ref } = Vue;
      const { useRouter } = VueRouter;
      const router = useRouter();
      const gameStore = window.useGameStore();
      const newUserName = ref('');
      
      function addUser() {
        if (newUserName.value.trim()) {
          gameStore.addUser({
            name: newUserName.value.trim()
          });
          newUserName.value = '';
        }
      }
      
      function deleteUser(userId) {
        if (confirm('确定要删除该用户吗？该用户的存档也会被删除！')) {
          gameStore.deleteUser(userId);
        }
      }
      
      function selectUser(user) {
        gameStore.setCurrentUser(user);
        alert(`已切换到 ${user.name}，正在加载存档...`);
        router.push('/');
      }
      
      return {
        gameStore,
        newUserName,
        addUser,
        deleteUser,
        selectUser
      };
    },
    template: `
      <div class="user-management container">
        <h2 style="color: #ffd700; margin-bottom: 30px; text-align: center;">👥 用户管理</h2>
        
        <div v-if="gameStore.currentUser" style="text-align: center; padding: 15px; background: rgba(255,215,0,0.1); border: 2px solid #ffd700; border-radius: 10px; margin-bottom: 30px;">
          <p style="color: #ffd700; font-size: 18px; font-weight: bold;">
            当前用户：👤 {{ gameStore.currentUser.name }}
          </p>
        </div>
        
        <div class="add-user-form" style="background: rgba(255,255,255,0.08); padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid rgba(255,215,0,0.3);">
          <h3 style="margin-bottom: 15px; color: #ffd700;">添加新玩家</h3>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input 
              v-model="newUserName" 
              type="text" 
              placeholder="输入玩家名称"
              @keyup.enter="addUser"
              style="flex: 1; padding: 12px 15px; border: 2px solid rgba(255,215,0,0.5); border-radius: 8px; font-size: 16px; background: rgba(0,0,0,0.3); color: #eee;"
            >
            <button @click="addUser" style="background: #4CAF50; color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">➕ 添加</button>
          </div>
        </div>
        
        <UserList 
          :users="gameStore.users"
          @delete-user="deleteUser"
          @select-user="selectUser"
        />
      </div>
    `
  };
})();
