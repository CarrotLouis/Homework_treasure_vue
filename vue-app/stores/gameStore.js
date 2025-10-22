(function() {
  const { defineStore } = Pinia;

  window.useGameStore = defineStore('game', {
    state: () => ({
      // 当前用户
      currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
      
      // 用户列表（全局）
      users: JSON.parse(localStorage.getItem('treasureUsers') || '[]'),
      
      // 游戏进度（当前用户的）
      currentLocation: 'panorama',
      inventory: [],
      logs: [],
      
      // 游戏标志
      clueFound: false,
      decoded: false,
      hasBoat: false,
      foundBox: false,
      templeGuardDefeated: false,
      
      // 玩家属性
      playerStats: {
        health: 100,
        maxHealth: 100,
        attack: 15,
        defense: 8,
        gold: 50,
        experience: 0,
        level: 1
      },
      
      // 商店物品
      shopItems: [
        { id: 'sword1', name: '铁剑', type: 'weapon', attack: 5, price: 80, bought: false },
        { id: 'sword2', name: '钢剑', type: 'weapon', attack: 10, price: 150, bought: false },
        { id: 'armor1', name: '皮甲', type: 'armor', defense: 3, price: 70, bought: false },
        { id: 'armor2', name: '铁甲', type: 'armor', defense: 7, price: 130, bought: false },
        { id: 'potion', name: '治疗药水', type: 'consumable', price: 40, bought: false }
      ],
      
      // 随机事件次数限制
      randomEventCounts: {
        library: 0,
        river: 0,
        temple: 0,
        store: 0
      },
      maxRandomEvents: 5,
      
      // 战斗系统
      inBattle: false,
      currentEnemy: null,
      battleLog: [],
      templeGuardDefeated: false,
      gameOver: false,
      
      // 游戏历史（全局）
      gameHistory: JSON.parse(localStorage.getItem('treasureHistory') || '[]'),
      
      // 背景音乐
      bgmEnabled: localStorage.getItem('bgm_enabled') !== 'false',
      bgmVolume: parseFloat(localStorage.getItem('bgm_volume') || '0.3'), // 默认音量30%
      currentBgm: null,
      
      // 添加按钮锁定状态
      isProcessing: false
    }),
    
    actions: {
      // 用户管理
      addUser(user) {
        const newUser = {
          id: Date.now(),
          name: user.name,
          totalGold: 0,
          gamesCompleted: 0,
          bestScore: 0,
          createdAt: new Date().toISOString()
        };
        this.users.push(newUser);
        this.saveUsers();
        return newUser;
      },
      
      setCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        // 加载该用户的存档
        this.loadUserGameState(user.id);
      },
      
      deleteUser(userId) {
        this.users = this.users.filter(u => u.id !== userId);
        // 删除该用户的存档
        localStorage.removeItem(`gameState_${userId}`);
        this.saveUsers();
        
        // 如果删除的是当前用户，清空当前用户
        if (this.currentUser && this.currentUser.id === userId) {
          this.currentUser = null;
          localStorage.removeItem('currentUser');
          this.resetGame();
        }
      },
      
      // 游戏进度
      addLog(text) {
        const time = new Date().toLocaleTimeString();
        this.logs.push(`[${time}] ${text}`);
        this.saveGameState();
      },
      
      addToInventory(item) {
        // 小船不放入背包
        if (item === '小船') {
          return;
        }
        if (!this.inventory.includes(item)) {
          this.inventory.push(item);
          this.addLog(`获得物品：${item}`);
          this.saveGameState();
        }
      },
      
      goToLocation(location) {
        this.currentLocation = location;
        this.addLog(`前往：${this.getLocationName(location)}`);
        this.saveGameState();
        this.playLocationBgm(location);
      },
      
      getLocationName(location) {
        const names = {
          panorama: '全景视图',
          library: '图书馆',
          river: '河边',
          temple: '古庙',
          store: '商店'
        };
        return names[location] || location;
      },
      
      // 商店系统
      buyItem(item) {
        if (item.bought) {
          this.addLog('该物品已购买！');
          return false;
        }
        
        if (this.playerStats.gold < item.price) {
          this.addLog('金币不足！');
          return false;
        }
        
        this.playerStats.gold -= item.price;
        item.bought = true;
        
        if (item.type === 'weapon') {
          this.playerStats.attack += item.attack;
          this.addLog(`购买 ${item.name}，攻击力 +${item.attack}！`);
        } else if (item.type === 'armor') {
          this.playerStats.defense += item.defense;
          this.addLog(`购买 ${item.name}，防御力 +${item.defense}！`);
        } else if (item.type === 'consumable') {
          this.addToInventory(item.name);
          this.addLog(`购买 ${item.name}！`);
          item.bought = false;
        }
        
        this.saveGameState();
        return true;
      },
      
      // 战斗系统
      startBattle(enemy) {
        // 防止重复触发战斗
        if (this.inBattle) {
          this.addLog('已经在战斗中！');
          return;
        }
        
        this.inBattle = true;
        this.currentEnemy = {
          name: enemy.name,
          health: enemy.health,
          maxHealth: enemy.health,
          attack: enemy.attack,
          defense: enemy.defense,
          goldReward: enemy.goldReward,
          expReward: enemy.expReward
        };
        this.battleLog = [];
        this.addBattleLog(`遭遇 ${enemy.name}！战斗开始！`);
        this.playBattleBgm();
      },
      
      addBattleLog(text) {
        this.battleLog.push(text);
      },
      
      playerAttack() {
        if (!this.inBattle || !this.currentEnemy) return;
        
        const damage = Math.max(1, this.playerStats.attack - this.currentEnemy.defense);
        this.currentEnemy.health = Math.max(0, this.currentEnemy.health - damage);
        this.battleLog.push(`⚔️ 你对 ${this.currentEnemy.name} 造成了 ${damage} 点伤害！`);
        
        if (this.currentEnemy.health <= 0) {
          this.winBattle();
          return;
        }
        
        setTimeout(() => {
          this.enemyAttack();
        }, 500);
      },
      
      enemyAttack() {
        if (!this.inBattle || !this.currentEnemy || this.currentEnemy.health <= 0) return;
        
        const damage = Math.max(1, this.currentEnemy.attack - this.playerStats.defense);
        this.playerStats.health = Math.max(0, this.playerStats.health - damage);
        this.battleLog.push(`💥 ${this.currentEnemy.name} 对你造成了 ${damage} 点伤害！`);
        
        // 检查玩家是否死亡
        if (this.playerStats.health <= 0) {
          this.loseBattle();
        }
      },
      
      loseBattle() {
        this.gameOver = true;
        this.battleLog.push(`💀 你被击败了...`);
        this.addLog(`💀 战斗失败！你的冒险到此结束...`);
        
        setTimeout(() => {
          alert('💀 游戏失败！\n\n你在战斗中被击败了...\n\n点击确定重新开始游戏');
          
          // 直接重新开始游戏
          this.resetGame();
          this.gameOver = false;
        }, 1000);
      },
      
      flee() {
        if (!this.inBattle) return;
        
        const fleeChance = 0.6;
        if (Math.random() < fleeChance) {
          this.battleLog.push('🏃 你成功逃跑了！');
          this.addLog('🏃 你逃离了战斗');
          
          // 重置战斗状态，但不重置 foundBox 和其他进度
          this.inBattle = false;
          this.currentEnemy = null;
          this.battleLog = [];
          
          // 如果是神庙守卫战斗，不重置 foundBox，允许玩家重新探索
          // 只是简单退出战斗，保持在当前位置
        } else {
          this.battleLog.push('❌ 逃跑失败！');
          setTimeout(() => {
            this.enemyAttack();
          }, 500);
        }
      },
      
      usePotion() {
        const potionIndex = this.inventory.indexOf('治疗药水');
        if (potionIndex === -1) {
          this.battleLog.push('❌ 没有治疗药水！');
          return;
        }
        
        this.inventory.splice(potionIndex, 1);
        const healAmount = 40;
        this.playerStats.health = Math.min(
          this.playerStats.maxHealth,
          this.playerStats.health + healAmount
        );
        this.battleLog.push(`🧪 使用了治疗药水，恢复了 ${healAmount} 点生命！`);
        
        setTimeout(() => {
          this.enemyAttack();
        }, 500);
      },
      
      winBattle() {
        if (!this.currentEnemy) return;
        
        const { goldReward, expReward, name } = this.currentEnemy;
        
        this.battleLog.push(`✅ 你击败了 ${name}！`);
        this.battleLog.push(`💰 获得 ${goldReward} 金币`);
        this.battleLog.push(`⭐ 获得 ${expReward} 经验`);
        
        this.addLog(`✅ 战斗胜利！击败了 ${name}`);
        this.playerStats.gold += goldReward;
        this.playerStats.experience += expReward;
        
        // 检查是否击败了神庙守卫
        if (name === '神庙守卫') {
          this.templeGuardDefeated = true;
          this.addLog('🎉 击败了神庙守卫！现在可以打开宝箱了！');
        }
        
        // 检查升级
        this.checkLevelUp();
        
        setTimeout(() => {
          this.inBattle = false;
          this.currentEnemy = null;
          this.battleLog = [];
          this.playLocationBgm(this.currentLocation);
        }, 2000);
      },
      
      // 添加升级检查方法
      checkLevelUp() {
        const expNeeded = this.playerStats.level * 100;
        
        if (this.playerStats.experience >= expNeeded) {
          this.playerStats.level++;
          this.playerStats.experience -= expNeeded;
          
          // 升级奖励
          this.playerStats.maxHealth += 20;
          this.playerStats.health = this.playerStats.maxHealth; // 升级时恢复满血
          this.playerStats.attack += 3;
          this.playerStats.defense += 2;
          
          this.battleLog.push(`🎉 升级了！当前等级：${this.playerStats.level}`);
          this.battleLog.push(`💪 生命上限 +20，攻击 +3，防御 +2`);
          this.addLog(`🎉 恭喜升级！当前等级：${this.playerStats.level}`);
          
          // 检查是否可以继续升级
          if (this.playerStats.experience >= this.playerStats.level * 100) {
            this.checkLevelUp();
          }
        }
      },
      
      // 随机事件（优化版）
      triggerRandomEvent(location) {
        if (this.randomEventCounts[location] >= this.maxRandomEvents) {
          this.addLog('该区域的随机事件已用尽！');
          return;
        }
        
        this.randomEventCounts[location]++;
        const remaining = this.maxRandomEvents - this.randomEventCounts[location];
        
        let events = [];
        
        // 古庙：无商人，更多陷阱，更多金币
        if (location === 'temple') {
          events = [
            { text: '你发现了一个隐藏的宝箱！', gold: 80, item: null, weight: 2 },
            { text: '你踩到了陷阱！', damage: 12, weight: 4 },
            { text: '你发现了神庙的供奉金币！', gold: 60, weight: 3 },
            { text: '古老的机关被触发，你受伤了！', damage: 10, weight: 3 },
            { text: '什么都没发生...', gold: 0, weight: 1 }
          ];
        }
        // 其他地点：正常金币，有商人
        else {
          events = [
            { text: '你发现了一个宝箱！', gold: 30, item: null, weight: 3 },
            { text: '你遇到了一位旅行商人，他送给你一瓶治疗药水。', gold: 0, item: '治疗药水', weight: 2 },
            { text: '你踩到了陷阱！', damage: 8, weight: 1 },
            { text: '你发现了一袋金币！', gold: 25, weight: 3 },
            { text: '你捡到了一些散落的金币。', gold: 15, weight: 3 },
            { text: '什么都没发生...', gold: 0, weight: 2 }
          ];
        }
        
        const totalWeight = events.reduce((sum, e) => sum + e.weight, 0);
        let random = Math.random() * totalWeight;
        let event = events[0];
        
        for (const e of events) {
          random -= e.weight;
          if (random <= 0) {
            event = e;
            break;
          }
        }
        
        this.addLog(event.text);
        
        if (event.gold) {
          this.playerStats.gold += event.gold;
          this.addLog(`获得 ${event.gold} 金币！`);
        }
        if (event.item) {
          this.addToInventory(event.item);
        }
        if (event.damage) {
          this.playerStats.health = Math.max(1, this.playerStats.health - event.damage);
          this.addLog(`受到 ${event.damage} 点伤害！`);
        }
        
        this.addLog(`该区域剩余随机事件次数：${remaining}`);
        this.saveGameState();
      },
      
      // 背景音乐控制
      playLocationBgm(location) {
        if (!this.bgmEnabled) return;
        
        const bgmMap = {
          panorama: 'music/index.mp3',
          library: 'music/library.mp3',
          river: 'music/river.mp3',
          temple: 'music/temple.mp3',
          store: 'music/store.mp3'  // 商店音乐
        };
        
        this.playBgm(bgmMap[location] || bgmMap.panorama);
      },
      
      playBattleBgm() {
        if (!this.bgmEnabled) return;
        this.playBgm('music/battle.mp3');
      },
      
      playBgm(src) {
        if (this.currentBgm) {
          this.currentBgm.pause();
          this.currentBgm.currentTime = 0;
        }
        
        this.currentBgm = new Audio(src);
        this.currentBgm.loop = true;
        this.currentBgm.volume = this.bgmVolume;
        
        this.currentBgm.play().catch(err => {
          console.log('音乐播放失败（可能被浏览器阻止）:', err);
          const playOnInteraction = () => {
            if (this.bgmEnabled && this.currentBgm) {
              this.currentBgm.play();
              document.removeEventListener('click', playOnInteraction);
            }
          };
          document.addEventListener('click', playOnInteraction, { once: true });
        });
      },
      
      toggleBgm() {
        this.bgmEnabled = !this.bgmEnabled;
        localStorage.setItem('bgm_enabled', this.bgmEnabled);
        
        if (this.bgmEnabled) {
          this.playLocationBgm(this.currentLocation);
        } else if (this.currentBgm) {
          this.currentBgm.pause();
        }
      },
      
      setBgmVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('bgm_volume', this.bgmVolume);
        if (this.currentBgm) {
          this.currentBgm.volume = this.bgmVolume;
        }
      },
      
      // 工具方法
      randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      
      // 游戏完成
      completeGame() {
        const score = this.playerStats.gold + this.playerStats.level * 50;
        
        // 更新当前用户统计
        if (this.currentUser) {
          const user = this.users.find(u => u.id === this.currentUser.id);
          if (user) {
            user.totalGold += this.playerStats.gold;
            user.gamesCompleted++;
            if (score > user.bestScore) {
              user.bestScore = score;
            }
            this.saveUsers();
          }
        }
        
        this.gameHistory.push({
          id: Date.now(),
          playerName: this.currentUser ? this.currentUser.name : '冒险者',
          userId: this.currentUser ? this.currentUser.id : null,
          gold: this.playerStats.gold,
          level: this.playerStats.level,
          score: score,
          completedAt: new Date().toISOString()
        });
        this.saveHistory();
      },
      
      // 重置游戏（清空当前游戏状态）
      resetGame() {
        this.currentLocation = 'panorama';
        this.inventory = [];
        this.logs = [];
        this.clueFound = false;
        this.decoded = false;
        this.hasBoat = false;
        this.foundBox = false;
        this.templeGuardDefeated = false;
        this.playerStats = {
          health: 100,
          maxHealth: 100,
          attack: 15,
          defense: 8,
          gold: 50,
          experience: 0,
          level: 1
        };
        this.shopItems = [
          { id: 'sword1', name: '铁剑', type: 'weapon', attack: 5, price: 80, bought: false },
          { id: 'sword2', name: '钢剑', type: 'weapon', attack: 10, price: 150, bought: false },
          { id: 'armor1', name: '皮甲', type: 'armor', defense: 3, price: 70, bought: false },
          { id: 'armor2', name: '铁甲', type: 'armor', defense: 7, price: 130, bought: false },
          { id: 'potion', name: '治疗药水', type: 'consumable', price: 40, bought: false }
        ];
        this.randomEventCounts = {
          library: 0,
          river: 0,
          temple: 0,
          store: 0
        };
        this.inBattle = false;
        this.currentEnemy = null;
        this.battleLog = [];
        this.addLog('🎮 游戏重新开始！探索世界，寻找宝藏！');
        this.playLocationBgm('panorama');
        
        // 保存重置后的状态
        this.saveGameState();
      },
      
      // 存储方法（用户隔离）
      saveUsers() {
        localStorage.setItem('treasureUsers', JSON.stringify(this.users));
      },
      
      saveHistory() {
        localStorage.setItem('treasureHistory', JSON.stringify(this.gameHistory));
      },
      
      saveGameState() {
        const state = {
          currentLocation: this.currentLocation,
          inventory: this.inventory,
          logs: this.logs,
          clueFound: this.clueFound,
          decoded: this.decoded,
          hasBoat: this.hasBoat,
          foundBox: this.foundBox,
          templeGuardDefeated: this.templeGuardDefeated,
          playerStats: this.playerStats,
          shopItems: this.shopItems,
          randomEventCounts: this.randomEventCounts
        };
        
        // 如果有当前用户，保存到用户专属存档
        if (this.currentUser) {
          localStorage.setItem(`gameState_${this.currentUser.id}`, JSON.stringify(state));
        }
        // 同时保存到通用存档（用于没有用户系统时）
        localStorage.setItem('currentGameState', JSON.stringify(state));
      },
      
      loadUserGameState(userId) {
        const saved = localStorage.getItem(`gameState_${userId}`);
        if (saved) {
          const state = JSON.parse(saved);
          Object.assign(this, state);
          this.addLog(`读取 ${this.currentUser.name} 的存档成功！`);
        } else {
          // 如果该用户没有存档，重置游戏
          this.resetGame();
        }
        this.playLocationBgm(this.currentLocation);
      },
      
      loadGameState() {
        // 如果有当前用户，加载用户存档
        if (this.currentUser) {
          this.loadUserGameState(this.currentUser.id);
        } else {
          // 否则加载通用存档
          const saved = localStorage.getItem('currentGameState');
          if (saved) {
            const state = JSON.parse(saved);
            Object.assign(this, state);
            this.addLog('读取存档成功！');
          } else {
            this.resetGame();
          }
        }
      }
    },
    
    getters: {
      sortedUsers: (state) => {
        return [...state.users].sort((a, b) => b.bestScore - a.bestScore);
      },
      
      recentGames: (state) => {
        return [...state.gameHistory].sort((a, b) => 
          new Date(b.completedAt) - new Date(a.completedAt)
        ).slice(0, 10);
      },
      
      canGoToTemple: (state) => {
        return state.decoded && state.hasBoat;
      }
    }
  });
})();
