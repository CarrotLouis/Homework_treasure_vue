(function() {
  // 场景组件
  const LocationScene = {
    name: 'LocationScene',
    props: {
      location: String,
      gameStore: Object,
      isProcessing: Boolean
    },
    emits: ['action'],
    setup(props, { emit }) {
      const { computed } = Vue;
      
      const locations = {
        panorama: {
          name: '全景视图',
          desc: '你站在一片开阔地，周围有几个可以探索的地方...',
          actions: []
        },
        library: {
          name: '图书馆',
          desc: '你站在古老的图书馆，书架间散落着羊皮纸...',
          actions: []
        },
        river: {
          name: '河边',
          desc: '河水缓缓流淌，岸边可能藏着小船...',
          actions: []
        },
        store: {
          name: '商店',
          desc: '一个充满神秘气息的商店，老板热情地向你推荐商品...',
          actions: []
        },
        temple: {
          name: '古庙',
          desc: '古庙中回荡着低语，似乎有宝藏的气息...',
          actions: []
        }
      };
      
      // 动态生成动作按钮
      const currentScene = computed(() => {
        const loc = locations[props.location] || locations.panorama;
        const actions = [];
        
        if (props.location === 'panorama') {
          actions.push({ id: 'goLibrary', text: '📚 前往图书馆', location: 'library' });
          actions.push({ id: 'goRiver', text: '🌊 前往河边', location: 'river' });
          actions.push({ id: 'goStore', text: '🏪 前往商店', location: 'store' });
          actions.push({ 
            id: 'goTemple', 
            text: props.gameStore.hasBoat ? '⛩️ 前往古庙' : '⛩️ 前往古庙 (需船)', 
            location: 'temple', 
            requires: 'canGoToTemple' 
          });
        } else if (props.location === 'library') {
          actions.push({ id: 'searchClue', text: '🔍 寻找线索', check: '!clueFound' });
          // 修改：解密按钮 - 只有在未解密且有线索时才可用
          if (!props.gameStore.decoded) {
            actions.push({ 
              id: 'decodeScript', 
              text: '📜 解密古文', 
              requires: 'clueFound'
            });
          } else {
            // 已解密时显示不可点击的按钮
            actions.push({ 
              id: 'decodeScript', 
              text: '📜 解密古文 (已完成)', 
              disabled: true
            });
          }
          const remaining = props.gameStore.maxRandomEvents - props.gameStore.randomEventCounts.library;
          actions.push({ id: 'randomEvent', text: `🎲 触发随机事件 (剩余: ${remaining})`, random: true });
          actions.push({ id: 'back', text: '🔙 返回全景', location: 'panorama' });
        } else if (props.location === 'river') {
          actions.push({ id: 'findBoat', text: '⛵ 寻找小船', check: '!hasBoat' });
          actions.push({ 
            id: 'crossRiver', 
            text: props.gameStore.hasBoat ? '🚣 渡河前往古庙' : '🚣 渡河前往古庙 (需船)', 
            requires: 'hasBoat' 
          });
          const remaining = props.gameStore.maxRandomEvents - props.gameStore.randomEventCounts.river;
          actions.push({ id: 'randomEvent', text: `🎲 触发随机事件 (剩余: ${remaining})`, random: true });
          actions.push({ id: 'back', text: '🔙 返回全景', location: 'panorama' });
        } else if (props.location === 'store') {
          const remaining = props.gameStore.maxRandomEvents - props.gameStore.randomEventCounts.store;
          actions.push({ id: 'randomEvent', text: `🎲 触发随机事件 (剩余: ${remaining})`, random: true });
          actions.push({ id: 'back', text: '🔙 返回全景', location: 'panorama' });
        } else if (props.location === 'temple') {
          actions.push({ id: 'searchTemple', text: '🔦 搜索神庙', check: '!foundBox' });
          actions.push({ id: 'openBox', text: '📦 打开宝箱', requires: 'templeGuardDefeated', check: 'foundBox' });
          const remaining = props.gameStore.maxRandomEvents - props.gameStore.randomEventCounts.temple;
          actions.push({ id: 'randomEvent', text: `🎲 触发随机事件 (剩余: ${remaining})`, random: true });
          actions.push({ id: 'back', text: '🔙 返回全景', location: 'panorama' });
        }
        
        return { ...loc, actions };
      });
      
      function canDoAction(action) {
        if (props.isProcessing) return false;
        
        // 如果按钮被标记为禁用，直接返回 false
        if (action.disabled) return false;
        
        if (action.requires === 'canGoToTemple') {
          return props.gameStore.decoded && props.gameStore.hasBoat;
        }
        if (action.requires) {
          return props.gameStore[action.requires];
        }
        if (action.check) {
          const check = action.check.replace('!', '');
          return action.check.startsWith('!') ? !props.gameStore[check] : props.gameStore[check];
        }
        if (action.random) {
          const loc = props.location;
          return props.gameStore.randomEventCounts[loc] < props.gameStore.maxRandomEvents;
        }
        return true;
      }
      
      function handleAction(action) {
        if (action.location) {
          emit('action', { type: 'navigate', location: action.location });
        } else {
          emit('action', { type: action.id });
        }
      }
      
      return {
        currentScene,
        canDoAction,
        handleAction
      };
    },
    template: `
      <div class="location-scene">
        <h2>{{ currentScene.name }}</h2>
        <p class="scene-desc">{{ currentScene.desc }}</p>
        
        <div class="scene-actions">
          <button
            v-for="action in currentScene.actions"
            :key="action.id"
            @click="handleAction(action)"
            :disabled="!canDoAction(action)"
            class="action-btn"
            :class="{ 'processing': isProcessing && !action.location }"
          >
            <span v-if="isProcessing && !action.location && !canDoAction(action)">⏳ 处理中...</span>
            <span v-else>{{ action.text }}</span>
          </button>
        </div>
      </div>
    `
  };

  // 商店组件
  const StoreScene = {
    name: 'StoreScene',
    props: {
      gameStore: Object,
      isProcessing: Boolean
    },
    emits: ['action'],
    template: `
      <div class="store-scene">
        <h2>🏪 商店</h2>
        <p class="scene-desc">欢迎光临！这里有各种冒险用品。</p>
        
        <div class="shop-items">
          <div 
            v-for="item in gameStore.shopItems" 
            :key="item.id"
            class="shop-item"
            :class="{ bought: item.bought && item.type !== 'consumable' }"
          >
            <div class="item-info">
              <h3>{{ item.name }}</h3>
              <p v-if="item.attack">攻击力 +{{ item.attack }}</p>
              <p v-if="item.defense">防御力 +{{ item.defense }}</p>
              <p v-if="item.type === 'consumable'">消耗品：恢复40点生命</p>
              <p class="price">💰 {{ item.price }} 金币</p>
            </div>
            <button 
              @click="$emit('action', { type: 'buyItem', item: item })"
              :disabled="(item.bought && item.type !== 'consumable') || isProcessing"
              class="buy-btn"
            >
              {{ (item.bought && item.type !== 'consumable') ? '已购买' : '购买' }}
            </button>
          </div>
        </div>
        
        <div class="scene-actions">
          <button 
            @click="$emit('action', { type: 'randomEvent' })" 
            class="action-btn" 
            :disabled="gameStore.randomEventCounts.store >= gameStore.maxRandomEvents || isProcessing"
            :class="{ 'processing': isProcessing }"
          >
            <span v-if="isProcessing">⏳ 处理中...</span>
            <span v-else>🎲 触发随机事件 (剩余: {{ gameStore.maxRandomEvents - gameStore.randomEventCounts.store }})</span>
          </button>
          <button @click="$emit('action', { type: 'navigate', location: 'panorama' })" class="action-btn">
            🔙 返回全景
          </button>
        </div>
      </div>
    `
  };

  // 战斗组件
  const BattleScene = {
    name: 'BattleScene',
    props: {
      gameStore: Object
    },
    emits: ['action'],
    template: `
      <div class="battle-scene">
        <h2>⚔️ 战斗中</h2>
        
        <div class="battle-status">
          <div class="combatant player">
            <h3>👤 你</h3>
            <div class="health-bar">
              <div class="health-fill" :style="{ width: (gameStore.playerStats.health / gameStore.playerStats.maxHealth * 100) + '%' }"></div>
            </div>
            <p>HP: {{ gameStore.playerStats.health }} / {{ gameStore.playerStats.maxHealth }}</p>
            <p>攻击: {{ gameStore.playerStats.attack }} | 防御: {{ gameStore.playerStats.defense }}</p>
          </div>
          
          <div class="vs">VS</div>
          
          <div class="combatant enemy" v-if="gameStore.currentEnemy">
            <h3>👹 {{ gameStore.currentEnemy.name }}</h3>
            <div class="health-bar">
              <div class="health-fill enemy" :style="{ width: (gameStore.currentEnemy.health / gameStore.currentEnemy.maxHealth * 100) + '%' }"></div>
            </div>
            <p>HP: {{ gameStore.currentEnemy.health }} / {{ gameStore.currentEnemy.maxHealth }}</p>
            <p>攻击: {{ gameStore.currentEnemy.attack }} | 防御: {{ gameStore.currentEnemy.defense }}</p>
          </div>
        </div>
        
        <div class="battle-log">
          <div v-for="(log, i) in gameStore.battleLog" :key="i" class="log-entry">
            {{ log }}
          </div>
        </div>
        
        <div class="battle-actions">
          <button @click="$emit('action', { type: 'attack' })" class="battle-btn attack">
            ⚔️ 攻击
          </button>
          <button 
            @click="$emit('action', { type: 'usePotion' })" 
            class="battle-btn item"
            :disabled="!gameStore.inventory.includes('治疗药水')"
          >
            🧪 使用药水
          </button>
          <button @click="$emit('action', { type: 'flee' })" class="battle-btn flee">
            🏃 逃跑
          </button>
        </div>
      </div>
    `
  };

  // 状态面板组件
  const StatusPanel = {
    name: 'StatusPanel',
    props: {
      gameStore: Object
    },
    template: `
      <div class="status-panel">
        <div class="stat-group">
          <span class="stat-label">💖 生命:</span>
          <span class="stat-value">{{ gameStore.playerStats.health }}/{{ gameStore.playerStats.maxHealth }}</span>
        </div>
        <div class="stat-group">
          <span class="stat-label">⚔️ 攻击:</span>
          <span class="stat-value">{{ gameStore.playerStats.attack }}</span>
        </div>
        <div class="stat-group">
          <span class="stat-label">🛡️ 防御:</span>
          <span class="stat-value">{{ gameStore.playerStats.defense }}</span>
        </div>
        <div class="stat-group">
          <span class="stat-label">💰 金币:</span>
          <span class="stat-value">{{ gameStore.playerStats.gold }}</span>
        </div>
        <div class="stat-group">
          <span class="stat-label">⭐ 等级:</span>
          <span class="stat-value">{{ gameStore.playerStats.level }}</span>
        </div>
        <div class="stat-group">
          <span class="stat-label">📊 经验:</span>
          <span class="stat-value">{{ gameStore.playerStats.experience }}/{{ gameStore.playerStats.level * 100 }}</span>
        </div>
      </div>
    `
  };

  // 背包组件
  const InventoryPanel = {
    name: 'InventoryPanel',
    props: {
      gameStore: Object
    },
    template: `
      <div class="inventory-panel">
        <h3>🎒 背包</h3>
        <div v-if="gameStore.inventory.length === 0" class="empty-inventory">
          背包是空的
        </div>
        <div v-else class="inventory-items">
          <div v-for="item in gameStore.inventory" :key="item" class="inventory-item">
            {{ item }}
          </div>
        </div>
      </div>
    `
  };

  // 日志组件 - 增强自动滚动
  const GameLog = {
    name: 'GameLog',
    props: {
      gameStore: Object
    },
    setup(props) {
      const logRef = Vue.ref(null);
      
      // 监听日志变化并自动滚动
      Vue.watch(() => props.gameStore.logs.length, () => {
        Vue.nextTick(() => {
          if (logRef.value) {
            logRef.value.scrollTop = logRef.value.scrollHeight;
          }
        });
      }, { immediate: true });
      
      // 监听战斗日志变化并自动滚动
      Vue.watch(() => props.gameStore.battleLog.length, () => {
        Vue.nextTick(() => {
          if (logRef.value) {
            logRef.value.scrollTop = logRef.value.scrollHeight;
          }
        });
      }, { immediate: true });
      
      return { logRef };
    },
    template: `
      <div class="game-log" ref="logRef">
        <h3>📜 游戏日志</h3>
        <div class="log-content">
          <div v-for="(log, i) in gameStore.logs" :key="i" class="log-line">
            {{ log }}
          </div>
        </div>
      </div>
    `
  };

  // 主游戏视图
  window.GameView = {
    name: 'GameView',
    components: {
      LocationScene,
      StoreScene,
      BattleScene,
      StatusPanel,
      InventoryPanel,
      GameLog
    },
    setup() {
      const { ref, computed, onMounted } = Vue;
      const gameStore = window.useGameStore();
      const isProcessing = ref(false);
      
      onMounted(() => {
        gameStore.loadGameState();
      });
      
      async function handleAction(action) {
        if (isProcessing.value || gameStore.gameOver) {
          console.log('正在处理中或游戏已结束，请稍候...');
          return;
        }
        
        isProcessing.value = true;
        
        try {
          const type = action.type;
          
          if (type === 'navigate') {
            gameStore.goToLocation(action.location);
            isProcessing.value = false;
            return;
          }
          
          if (type === 'buyItem') {
            gameStore.buyItem(action.item);
            isProcessing.value = false;
            return;
          }
          
          if (type === 'searchClue') {
            gameStore.addLog('你在书架间翻找...');
            await delay(1000);
            gameStore.clueFound = true;
            gameStore.addToInventory('古老线索');
            gameStore.addLog('✅ 找到了一份古老的线索！');
          }
          
          else if (type === 'decodeScript') {
            gameStore.addLog('你开始解密古文...');
            await delay(1500);
            gameStore.decoded = true;
            gameStore.addLog('✅ 解密成功！宝藏在古庙中！');
          }
          
          else if (type === 'findBoat') {
            gameStore.addLog('你在岸边寻找...');
            await delay(1000);
            if (Math.random() < 0.8) {
              gameStore.hasBoat = true;
              gameStore.addLog('✅ 找到了一艘小船！');
              gameStore.addLog('💡 现在可以前往古庙了！');
            } else {
              gameStore.addLog('❌ 没有找到船，再试一次吧...');
            }
          }
          
          else if (type === 'crossRiver') {
            gameStore.addLog('你乘船渡河...');
            await delay(1200);
            gameStore.addLog('✅ 成功渡河！');
            gameStore.goToLocation('temple');
          }
          
          else if (type === 'searchTemple') {
            // 移除 foundBox 检查，允许逃跑后重新探索
            if (gameStore.inBattle) {
              gameStore.addLog('❌ 战斗中无法搜索！');
              isProcessing.value = false;
              return;
            }
            
            // 如果已经击败守卫且找到宝箱，不能再搜索
            if (gameStore.foundBox && gameStore.templeGuardDefeated) {
              gameStore.addLog('❌ 已经搜索过神庙了！');
              isProcessing.value = false;
              return;
            }
            
            gameStore.addLog('你在神庙中搜索...');
            await delay(1500);
            
            if (Math.random() < 0.6) {
              gameStore.foundBox = true;
              gameStore.addLog('✅ 找到了一个神秘的宝箱！');
              await delay(800);
              gameStore.addLog('⚠️ 突然，神庙守卫出现了！');
              await delay(500);
              gameStore.startBattle({
                name: '神庙守卫',
                health: 70,
                maxHealth: 70,
                attack: 20,
                defense: 12,
                goldReward: 120,
                expReward: 180
              });
            } else {
              gameStore.addLog('⚠️ 糟糕！触发了陷阱！');
              await delay(500);
              gameStore.startBattle({
                name: '陷阱怪物',
                health: 45,
                maxHealth: 45,
                attack: 14,
                defense: 7,
                goldReward: 50,
                expReward: 70
              });
            }
          }
          
          else if (type === 'openBox') {
            if (!gameStore.foundBox) {
              gameStore.addLog('❌ 还没有找到宝箱！');
              isProcessing.value = false;
              return;
            }
            if (!gameStore.templeGuardDefeated) {
              gameStore.addLog('❌ 需要先击败神庙守卫！');
              isProcessing.value = false;
              return;
            }
            
            gameStore.addLog('你打开了宝箱...');
            await delay(1500);
            const gold = 300;
            gameStore.playerStats.gold += gold;
            gameStore.addToInventory('传说中的宝藏');
            gameStore.addLog(`🎉 恭喜！获得了传说中的宝藏！+${gold} 金币！`);
            gameStore.completeGame();
            
            setTimeout(() => {
              alert('🎉 恭喜通关！你找到了传说中的宝藏！\n查看排行榜了解你的成绩！');
            }, 500);
          }
          
          else if (type === 'randomEvent') {
            gameStore.addLog('你触发了随机事件...');
            await delay(800);
            gameStore.triggerRandomEvent(gameStore.currentLocation);
          }
          
          else if (type === 'attack') {
            gameStore.playerAttack();
            await delay(300);
          }
          
          else if (type === 'usePotion') {
            gameStore.usePotion();
            await delay(300);
          }
          
          else if (type === 'flee') {
            gameStore.flee();
            await delay(500);
          }
          
        } catch (error) {
          console.error('动作处理失败:', error);
          gameStore.addLog(`❌ 操作失败: ${error.message}`);
        } finally {
          isProcessing.value = false;
        }
      }
      
      function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      
      return {
        gameStore,
        handleAction,
        isProcessing
      };
    },
    template: `
      <div class="game-view container">
        <div class="game-main">
          <div class="game-header">
            <h2>🏴‍☠️ 寻宝冒险 <span v-if="gameStore.currentUser" style="color: #4CAF50;">- {{ gameStore.currentUser.name }}</span></h2>
            <div class="header-controls">
              <div class="music-controls">
                <button @click="gameStore.toggleBgm()" class="music-btn">
                  {{ gameStore.bgmEnabled ? '🔊' : '🔇' }}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  :value="gameStore.bgmVolume * 100"
                  @input="gameStore.setBgmVolume($event.target.value / 100)"
                  class="volume-slider"
                  :title="'音量: ' + Math.round(gameStore.bgmVolume * 100) + '%'"
                />
                <span class="volume-text">{{ Math.round(gameStore.bgmVolume * 100) }}%</span>
              </div>
              <button @click="gameStore.resetGame()" class="reset-btn">🔄 重新开始</button>
            </div>
          </div>
          
          <div class="game-layout">
            <div class="left-panel">
              <StatusPanel :gameStore="gameStore" />
              <InventoryPanel :gameStore="gameStore" />
            </div>
            
            <div class="center-panel">
              <BattleScene 
                v-if="gameStore.inBattle"
                :gameStore="gameStore"
                @action="handleAction"
              />
              <StoreScene
                v-else-if="gameStore.currentLocation === 'store'"
                :gameStore="gameStore"
                :isProcessing="isProcessing"
                @action="handleAction"
              />
              <LocationScene 
                v-else
                :location="gameStore.currentLocation"
                :gameStore="gameStore"
                :isProcessing="isProcessing"
                @action="handleAction"
              />
            </div>
            
            <div class="right-panel">
              <GameLog :gameStore="gameStore" />
            </div>
          </div>
        </div>
      </div>
    `
  };
})();
