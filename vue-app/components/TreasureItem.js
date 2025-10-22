export default {
  name: 'TreasureItem',
  props: {
    cell: Object,
    index: Number
  },
  emits: ['click'],
  template: `
    <div 
      :class="[
        'treasure-item',
        { 
          'revealed': cell.revealed,
          'has-treasure': cell.revealed && cell.hasTreasure,
          'has-hint': cell.revealed && cell.hasHint
        }
      ]"
      @click="$emit('click')"
      style="width: 48px; height: 48px; background: #e0e0e0; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; font-size: 24px; user-select: none;"
    >
      <span v-if="!cell.revealed">❓</span>
      <span v-else-if="cell.hasTreasure">💎</span>
      <span v-else-if="cell.hasHint" style="color: #dc3545; font-weight: bold; font-size: 20px;">{{ cell.hintValue }}</span>
      <span v-else style="color: #ccc;">·</span>
    </div>
  `
};
