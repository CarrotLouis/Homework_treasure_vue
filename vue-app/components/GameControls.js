export default {
  name: 'GameControls',
  props: {
    difficulty: String,
    soundEnabled: Boolean
  },
  emits: ['start-game', 'change-difficulty', 'toggle-sound'],
  template: `
    <div class="game-controls">
      <div class="control-group">
        <label>难度选择：</label>
        <select :value="difficulty" @change="$emit('change-difficulty', $event.target.value)">
          <option value="easy">简单 (6x6)</option>
          <option value="normal">普通 (8x8)</option>
          <option value="hard">困难 (10x10)</option>
        </select>
      </div>
      
      <div class="control-group">
        <button @click="$emit('toggle-sound')" style="background: #FF9800; color: white;">
          {{ soundEnabled ? '🔊 音效开' : '🔇 音效关' }}
        </button>
      </div>
      
      <button @click="$emit('start-game')" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: bold; padding: 12px 30px;">
        🎮 开始游戏
      </button>
    </div>
  `
};
