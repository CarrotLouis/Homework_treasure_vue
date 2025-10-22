export default {
  name: 'ScoreCard',
  props: {
    rank: Number,
    user: Object,
    scoreType: String
  },
  setup(props) {
    const { computed } = Vue;
    
    const medalEmoji = computed(() => {
      const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
      return medals[props.rank] || '';
    });
    
    const rankClass = computed(() => {
      if (props.rank === 1) return 'rank-1';
      if (props.rank === 2) return 'rank-2';
      if (props.rank === 3) return 'rank-3';
      return '';
    });
    
    const scoreLabel = computed(() => {
      return props.scoreType === 'bestScore' ? '最高分' : '总分';
    });
    
    const borderColor = computed(() => {
      if (props.rank === 1) return '#FFD700';
      if (props.rank === 2) return '#C0C0C0';
      if (props.rank === 3) return '#CD7F32';
      return '#e0e0e0';
    });
    
    const bgGradient = computed(() => {
      if (props.rank === 1) return 'linear-gradient(135deg, #FFF9E6 0%, #FFEDD5 100%)';
      if (props.rank === 2) return 'linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%)';
      if (props.rank === 3) return 'linear-gradient(135deg, #FFF0E6 0%, #FFE4CC 100%)';
      return 'white';
    });
    
    return {
      medalEmoji,
      rankClass,
      scoreLabel,
      borderColor,
      bgGradient
    };
  },
  template: `
    <div 
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '20px',
        background: bgGradient,
        border: '2px solid ' + borderColor,
        borderRadius: '12px',
        transition: 'all 0.3s'
      }"
    >
      <div style="min-width: 50px; text-align: center;">
        <span v-if="rank <= 3" style="font-size: 36px;">{{ medalEmoji }}</span>
        <span v-else style="font-size: 24px; font-weight: bold; color: #999;">#{{ rank }}</span>
      </div>
      
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <span style="font-size: 36px;">{{ user.avatar }}</span>
        <span style="font-weight: bold; font-size: 18px; color: #333;">{{ user.name }}</span>
      </div>
      
      <div style="text-align: center; min-width: 80px;">
        <div style="font-size: 28px; font-weight: bold; color: #667eea;">{{ user[scoreType] }}</div>
        <div style="font-size: 12px; color: #666;">{{ scoreLabel }}</div>
      </div>
      
      <div style="color: #666; font-size: 14px;">
        <span>游戏: {{ user.gamesPlayed }}</span>
      </div>
    </div>
  `
};
