// 通用 app 脚本：保存/恢复游戏状态、连接UI交互、并封装TreasureMap逻辑（async/await）

const STORAGE_KEY = 'treasure_game_state';

// 默认初始状态
const defaultState = {
  currentLocation: 'panorama',
  inventory: [],
  logs: [],
  foundBox: false,
  clueFound: false,
  decoded: false,
  hasBoat: false
};

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {...defaultState};
  try {
    const parsed = JSON.parse(raw);
    return {...defaultState, ...parsed};
  } catch (e) {
    console.error('读取存档失败，重置。', e);
    return {...defaultState};
  }
}

function appendLog(state, text) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${text}`;
  state.logs.push(line);
  saveState(state);
  renderLog(state);
}

function renderLog(state) {
  const log = document.getElementById('log');
  if (!log) return;
  log.textContent = state.logs.join('\n');
}

// 创建或更新初始化 UI 行为（保存/重置等）
function initCommonUI(state) {
  const btnSave = document.getElementById('btn-save');
  if (btnSave) {
    // 防止多次绑定
    btnSave.replaceWith(btnSave.cloneNode(true));
    const newBtn = document.getElementById('btn-save') || document.querySelector('[id="btn-save"]');
  }
  const saveBtn = document.getElementById('btn-save');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    saveState(state);
    alert('已保存进度');
  });

  const btnReset = document.getElementById('btn-reset');
  if (btnReset) btnReset.addEventListener('click', () => {
    if (confirm('重置游戏并清除本地存档？')) {
      localStorage.removeItem(STORAGE_KEY);
      location.href = 'index.html';
    }
  });
}

// 定义 TreasureMap 行为为 async 函数（与之前 Promise 逻辑等价）
const TreasureMap = {
  async getInitialClue() {
    await delay(800);
    return "在古老的图书馆里找到了第一个线索...";
  },

  async decodeAncientScript(clue) {
    await delay(1200);
    if (!clue) throw new Error('没有线索可以解码!');
    return "解码成功!宝藏在一座古老的神庙中...";
  },

  async findBoat() {
    await delay(1000);
    if (Math.random() < 0.8) return "找到了渡河的小船！";
    throw new Error('没有船，无法渡河！');
  },

  async crossRiver() {
    await delay(900);
    return "成功渡河，前往神庙！";
  },

  async searchTemple() {
    await delay(1400);
    if (Math.random() < 0.5) throw new Error('糟糕!遇到了神庙守卫!');
    return "找到了一个神秘的箱子...";
  },

  async openTreasureBox() {
    await delay(700);
    return "恭喜!你找到了传说中的宝藏!";
  }
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 页面特定逻辑
function setupPanorama(state) {
  initCommonUI(state);
  renderLog(state);

  // 点击热点进入页面
  document.querySelectorAll('.hotspot').forEach(btn => {
    btn.addEventListener('click', () => {
      const loc = btn.dataset.location;
      state.currentLocation = loc;
      saveState(state);
      location.href = loc + '.html';
    });
  });
}

function setupLocationPage(state, locationName) {
  initCommonUI(state);
  renderLog(state);

  // 在页面顶部显示当前状态简要（追加到 location-desc）
  const desc = document.querySelector('.location-desc');
  if (desc) {
    let s = `当前进度：`;
    s += state.clueFound ? '已找到线索；' : '未找到线索；';
    s += state.decoded ? '已解密；' : '未解密；';
    s += state.hasBoat ? '有船；' : '无船；';
    s += state.foundBox ? '找到箱子；' : '';
    desc.textContent += '\n\n' + s;
  }

  // 绑定活动按钮
  document.querySelectorAll('.activity').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      try {
        if (action === 'searchClue') {
          const clue = await TreasureMap.getInitialClue();
          appendLog(state, clue);
          state.clueFound = true;
          if (!state.inventory.includes('线索')) state.inventory.push('线索');
          saveState(state);
        } else if (action === 'decodeScript') {
          if (!state.clueFound) {
            appendLog(state, '没有线索，无法解密。');
            return;
          }
          const res = await TreasureMap.decodeAncientScript('线索');
          appendLog(state, res);
          state.decoded = true;
          saveState(state);
        } else if (action === 'findBoat') {
          const res = await TreasureMap.findBoat();
          appendLog(state, res);
          state.hasBoat = true;
          if (!state.inventory.includes('小船')) state.inventory.push('小船');
          saveState(state);
        } else if (action === 'crossRiver') {
          if (!state.hasBoat) {
            appendLog(state, '没有小船，无法渡河。');
            return;
          }
          const res = await TreasureMap.crossRiver();
          appendLog(state, res);
          saveState(state);
        } else if (action === 'searchTemple') {
          const res = await TreasureMap.searchTemple();
          appendLog(state, res);
          state.foundBox = true;
          if (!state.inventory.includes('神秘箱子')) state.inventory.push('神秘箱子');
          saveState(state);
        } else if (action === 'openBox') {
          if (!state.foundBox) {
            appendLog(state, '没有找到箱子，无法打开。');
            return;
          }
          const res = await TreasureMap.openTreasureBox();
          appendLog(state, res);
          if (!state.inventory.includes('宝藏')) state.inventory.push('宝藏');
          saveState(state);
        }
      } catch (err) {
        appendLog(state, '交互失败：' + err.message);
      }
    });
  });
}

// 页面加载时入口
document.addEventListener('DOMContentLoaded', () => {
  const state = loadState();
  // 如果是 index.html（全景页）
  if (document.body.contains(document.getElementById('panorama'))) {
    setupPanorama(state);
    appendLog(state, '回到全景页。');
    return;
  }

  // 如果是 location 页面
  const path = location.pathname.split('/').pop();
  if (path === 'library.html') {
    setupLocationPage(state, 'library');
    appendLog(state, '进入 图书馆。');
    return;
  }
  if (path === 'river.html') {
    setupLocationPage(state, 'river');
    appendLog(state, '进入 河边。');
    return;
  }
  if (path === 'temple.html') {
    setupLocationPage(state, 'temple');
    appendLog(state, '进入 古庙。');
    return;
  }

  // inventory page handled separately
});

// === 背景音乐控制 ===
function initBgm(musicPath) {
    const audio = new Audio(musicPath);
    audio.loop = true;
  
    // 检查是否首次打开网页（仅提示一次）
    if (!localStorage.getItem('bgm_notice_shown')) {
      alert('🎵 音乐自动播放，若浏览器阻止，首次点击页面即可播放。');
      localStorage.setItem('bgm_notice_shown', 'true');
    }
  
    const saved = localStorage.getItem('bgm_enabled');
    let enabled = saved !== 'false'; // 默认开启音乐
  
    const btn = document.getElementById('btn-music');
    if (btn) {
      btn.textContent = enabled ? '关闭音乐' : '开启音乐';
      if (!enabled) btn.classList.add('paused');
      btn.addEventListener('click', () => {
        enabled = !enabled;
        localStorage.setItem('bgm_enabled', enabled);
        if (enabled) {
          audio.play().catch(() => {});
          btn.textContent = '关闭音乐';
          btn.classList.remove('paused');
        } else {
          audio.pause();
          btn.textContent = '开启音乐';
          btn.classList.add('paused');
        }
      });
    }
  
    // 尝试自动播放音乐
    if (enabled) {
      audio.play().catch(() => {
        // 若被浏览器拦截，等用户首次点击再播放
        document.body.addEventListener('click', () => {
          if (enabled) audio.play();
        }, { once: true });
      });
    }
  }
  

  if (btn) {
    if (enabled) btn.classList.remove('paused'); else btn.classList.add('paused');
  }
  