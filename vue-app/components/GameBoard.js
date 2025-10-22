import TreasureItem from './TreasureItem.js';

export default {
  name: 'GameBoard',
  components: {
    TreasureItem
  },
  props: {
    difficulty: String,
    soundEnabled: Boolean
  },
  emits: ['game-over'],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted } = Vue;
    
    const boardSize = computed(() => {
      const sizes = { easy: 6, normal: 8, hard: 10 };
      return sizes[props.difficulty] || 8;
    });
    
    const treasureCount = computed(() => {
      return Math.floor(boardSize.value * boardSize.value * 0.15);
    });
    
    const board = ref([]);
    const score = ref(0);
    const moves = ref(0);
    const remainingTreasures = ref(0);
    const gameOver = ref(false);
    const startTime = ref(null);
    const elapsedTime = ref(0);
    let timer = null;
    
    const formattedTime = computed(() => {
      const seconds = Math.floor(elapsedTime.value / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    });
    
    const boardStyle = computed(() => ({
      gridTemplateColumns: `repeat(${boardSize.value}, 1fr)`,
      width: `${boardSize.value * 50}px`,
      height: `${boardSize.value * 50}px`
    }));
    
    function initBoard() {
      const size = boardSize.value * boardSize.value;
      board.value = Array(size).fill(null).map(() => ({
        revealed: false,
        hasTreasure: false,
        hasHint: false,
        hintValue: 0
      }));
      
      // 放置宝藏
      let treasuresPlaced = 0;
      while (treasuresPlaced < treasureCount.value) {
        const randomIndex = Math.floor(Math.random() * size);
        if (!board.value[randomIndex].hasTreasure) {
          board.value[randomIndex].hasTreasure = true;
          treasuresPlaced++;
        }
      }
      
      // 计算提示
      board.value.forEach((cell, index) => {
        if (!cell.hasTreasure) {
          cell.hintValue = countAdjacentTreasures(index);
          cell.hasHint = cell.hintValue > 0;
        }
      });
      
      remainingTreasures.value = treasureCount.value;
      startTime.value = Date.now();
      
      timer = setInterval(() => {
        elapsedTime.value = Date.now() - startTime.value;
      }, 100);
    }
    
    function countAdjacentTreasures(index) {
      const row = Math.floor(index / boardSize.value);
      const col = index % boardSize.value;
      let count = 0;
      
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const newRow = row + i;
          const newCol = col + j;
          if (newRow >= 0 && newRow < boardSize.value && newCol >= 0 && newCol < boardSize.value) {
            const newIndex = newRow * boardSize.value + newCol;
            if (board.value[newIndex].hasTreasure) count++;
          }
        }
      }
      return count;
    }
    
    function handleClick(index) {
      if (board.value[index].revealed || gameOver.value) return;
      
      board.value[index].revealed = true;
      moves.value++;
      
      if (board.value[index].hasTreasure) {
        score.value += 100;
        remainingTreasures.value--;
        if (props.soundEnabled) playSound('treasure');
        
        if (remainingTreasures.value === 0) {
          endGame();
        }
      } else {
        score.value -= 10;
        if (props.soundEnabled) playSound('click');
      }
    }
    
    function playSound(type) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'treasure') {
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.3;
        } else {
          oscillator.frequency.value = 400;
          gainNode.gain.value = 0.1;
        }
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (e) {
        console.log('音效播放失败', e);
      }
    }
    
    function endGame() {
      gameOver.value = true;
      clearInterval(timer);
      emit('game-over', {
        score: score.value,
        moves: moves.value,
        time: elapsedTime.value
      });
    }
    
    function resetGame() {
      score.value = 0;
      moves.value = 0;
      elapsedTime.value = 0;
      gameOver.value = false;
      initBoard();
    }
    
    onMounted(() => {
      initBoard();
    });
    
    onUnmounted(() => {
      if (timer) clearInterval(timer);
    });
    
    return {
      board,
      score,
      moves,
      remainingTreasures,
      gameOver,
      formattedTime,
      boardStyle,
      handleClick,
      resetGame
    };
  },
  template: `
    <div class="game-board" style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
      <div style="display: flex; gap: 30px; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; font-weight: bold;">
        <div style="font-size: 18px;">⏱️ 时间: {{ formattedTime }}</div>
        <div style="font-size: 18px;">🎯 分数: {{ score }}</div>
        <div style="font-size: 18px;">👣 步数: {{ moves }}</div>
        <div style="font-size: 18px;">💎 剩余: {{ remainingTreasures }}</div>
      </div>
      
      <div :style="{ display: 'grid', gap: '2px', background: '#ddd', padding: '2px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', ...boardStyle }">
        <TreasureItem
          v-for="(cell, index) in board"
          :key="index"
          :cell="cell"
          :index="index"
          @click="handleClick(index)"
        />
      </div>
      
      <div v-if="gameOver" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center; z-index: 1000;">
        <h2 style="color: #667eea; margin-bottom: 20px;">🎉 游戏结束！</h2>
        <p style="font-size: 18px; margin: 10px 0;">得分: {{ score }}</p>
        <p style="font-size: 18px; margin: 10px 0;">步数: {{ moves }}</p>
        <p style="font-size: 18px; margin: 10px 0;">时间: {{ formattedTime }}</p>
        <button @click="resetGame" style="margin-top: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; font-weight: bold;">再玩一次</button>
      </div>
    </div>
  `
};
