<script setup>
import {computed, reactive, ref, watch, onMounted, onUnmounted} from 'vue';
import {onLoad, onReady} from '@dcloudio/uni-app';
import {getParams} from "@/sheep/router";
import {useI18n} from "vue-i18n";
import {useGameCommon} from "@/sheep/hooks/useGameCommon2";
import bluetooth from "@/sheep/stores/bluetooth";
import {
  getGameConfig,

  scoreConfig
} from "@/sheep/config/bluetoothConfig";
import DartBoard from "@/pages/game/routine/twist/DartBoard.vue";

// 状态管理
const currentScore = ref('--');
const totalScore = ref(0);
const round = ref(1);
const throwCount = ref(1);
const isScorePopping = ref(false);
const isTotalPopping = ref(false);
const scoreInfo = ref({});

// 常量定义
const CS = 350; // 画布宽高
const cx = CS / 2;
const cy = CS / 2;
const M = 50; // 边缘留白
const R = CS / 2 - M; // 板面半径 = 250
const G = CS / 2; // 发光外径 = 300
const N = R + 15; // 数字半径 = 265

// 各环半径
const radii = {
  dblIn: R * 0.85,
  dblOut: R * 0.92,
  triIn: R * 0.55,
  triOut: R * 0.6,
  bullOut: R * 0.12,
  bullIn: R * 0.05,
};

// 配色
const col = {
  glowInner: 'rgba(126,90,255,0.4)',
  glowOuter: 'rgba(126,90,255,0)',
  bg0: '#1b1b1b',
  bg1: '#0d0d0d',
  red: '#d22e2e',
  grn: '#068d3c',
  brn: '#b07d30',
  drk: '#1b1b1b',
  gold: '#f5a623',
  hl: 'rgba(17,187,204,0.4)',
};

// 靶号从 5 开始顺时针
const nums = [5, 20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12];
const S = 20;
const step = (2 * Math.PI) / S;
const start = -Math.PI / 2;

// 动画状态
let anim = null;
const trail = [];
const hls = [];

// 引用
const myCanvasRef = ref(null);
const iframeDom = ref(null); // 新增 ref 引用

const scoreInfoChange=ref(0);
// 低延迟：函数型回调，绕过 watch 队列
const onBleMessage = (code) => {
  let item = scoreConfig[code] || {};
  item.code = code;
  item.isNext = (code === '65') || (typeof code === 'string' && code.endsWith('65'));
  if (item.hit===null||item.hit===undefined){
    item.hit=1
  }else {
    item.hit=2
  }
  scoreInfo.value = item;
  scoreInfoChange.value++;
};

// UI 弹跳
const pop = (type) => {
  if (type === 'score') {
    isScorePopping.value = true;
    setTimeout(() => (isScorePopping.value = false), 300);
  } else if (type === 'total') {
    isTotalPopping.value = true;
    setTimeout(() => (isTotalPopping.value = false), 300);
  }
};

// 绘制发光环
const drawGlow = (ctx) => {
  // 检查是否支持 createRadialGradient
  if (typeof ctx.createRadialGradient === 'function') {
    const grad = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    grad.addColorStop(0, col.glowInner);
    grad.addColorStop(1, col.glowOuter);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
  } else {
    // 替代方案：手动绘制多个同心圆模拟渐变效果
    const steps = 10; // 渐变步数
    for (let i = 0; i < steps; i++) {
      const radius = R * (0.2 + (i / steps) * 0.8);
      const alpha = (i / steps).toFixed(2);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(126,90,255,${alpha})`;
      ctx.fill();
    }
  }
};

const num = ref(1)
// 扇区
const drawSector = (ctx, ir, or, a1, a2, fill) => {
  console.log(num.value++)
  ctx.beginPath();
  ctx.arc(cx, cy, or, a1, a2);
  ctx.arc(cx, cy, ir, a2, a1, true);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
};

// 主板
const drawBoard = (ctx) => {
  ctx.clearRect(0, 0, CS, CS);
  drawGlow(ctx);

  // 背景
  const bg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); // 初始化 bg 渐变对象
  bg.addColorStop(0, col.bg0);
  bg.addColorStop(1, col.bg1);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.fillStyle = bg;
  ctx.fill();

  // 合并双倍区、三倍区及内单区的绘制逻辑
  for (let i = 0; i < S; i++) {
    const a1 = start + i * step;
    const a2 = a1 + step;
    const baseColor = i % 2 ? col.grn : col.red;
    const altColor = i % 2 ? col.drk : col.brn;

    // 双倍区与外单区
    drawSector(ctx, radii.dblIn, radii.dblOut, a1, a2, baseColor);
    drawSector(ctx, radii.dblIn, radii.triOut, a1, a2, altColor);

    // 三倍区与内单区
    drawSector(ctx, radii.triIn, radii.triOut, a1, a2, baseColor);
    drawSector(ctx, radii.triIn, radii.bullOut, a1, a2, altColor);
  }

  // 金环 & 径向线 (不含靶心)
  ctx.strokeStyle = col.gold;
  ctx.lineWidth = 2;
  [R, radii.dblOut, radii.dblIn, radii.triOut, radii.triIn].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
  });
  for (let i = 0; i < S; i++) {
    const a = start + i * step;
    const x1 = cx + radii.bullOut * Math.cos(a);
    const y1 = cy + radii.bullOut * Math.sin(a);
    const x2 = cx + radii.dblOut * Math.cos(a);
    const y2 = cy + radii.dblOut * Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 靶心
  ctx.beginPath();
  ctx.arc(cx, cy, radii.bullOut, 0, 2 * Math.PI);
  ctx.arc(cx, cy, radii.bullIn, 2 * Math.PI, 0, true);
  ctx.closePath();
  ctx.fillStyle = col.grn;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, radii.bullIn, 0, 2 * Math.PI);
  ctx.fillStyle = col.red;
  ctx.fill();
  [radii.bullOut, radii.bullIn].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
  });

  // 靶号（始终水平）
  ctx.fillStyle = col.gold;
  ctx.font = '20rpx sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  nums.forEach((n, i) => {
    const ang = start + i * step + step / 2;
    const x = cx + N * Math.cos(ang);
    const y = cy + N * Math.sin(ang);
    ctx.fillText(n.toString(), x, y); // n 转字符串
  });
};

// 判定
const getHit = (x, y) => {
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.hypot(dx, dy);
  if (r <= radii.bullIn) return {ring: 'innerBull', score: 50};
  if (r <= radii.bullOut) return {ring: 'outerBull', score: 25};
  let ang = Math.atan2(dy, dx) - start;
  if (ang < 0) ang += 2 * Math.PI;
  const idx = Math.floor(ang / step);
  const base = nums[idx];
  if (r <= radii.triIn) return {ring: 'singleIn', score: base, idx};
  if (r <= radii.triOut) return {ring: 'triple', score: base * 3, idx};
  if (r <= radii.dblIn) return {ring: 'singleOut', score: base, idx};
  if (r <= radii.dblOut) return {ring: 'double', score: base * 2, idx};
  return {ring: 'miss', score: 0};
};

// 飞镖
const drawDart = (ctx, x, y) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 6;
  // 头
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-12, -6);
  ctx.lineTo(-12, 6);
  ctx.closePath();
  ctx.fillStyle = '#aaa';
  ctx.fill();
  // 身
  ctx.fillStyle = '#666';
  ctx.fillRect(-12, -3, -36, 6);
  // 翼
  ctx.fillStyle = '#dd3333';
  for (let i = 0; i < 3; i++) {
    const t = (i * (2 * Math.PI) / 3) + Math.PI;
    ctx.beginPath();
    ctx.moveTo(-48, 0);
    ctx.lineTo(-48 + 12 * Math.cos(t + 0.3), 12 * Math.sin(t + 0.3));
    ctx.lineTo(-48 + 12 * Math.cos(t - 0.3), 12 * Math.sin(t - 0.3));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

// 高亮 & 尾迹
const drawEffects = (ctx, now) => {
  // 高亮淡出
  hls.forEach((h, index) => {
    let t = (now - h.t0) / h.dur;
    if (t > 1) {
      hls.splice(index, 1);
      return;
    }
    ctx.save();
    ctx.globalAlpha = (1 - t) * 0.4;
    ctx.fillStyle = col.hl;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    if (h.ring.startsWith('inner') || h.ring.startsWith('outer')) {
      const r = h.ring === 'innerBull' ? radii.bullIn : radii.bullOut;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      if (h.ring === 'outerBull') {
        ctx.arc(cx, cy, radii.bullIn, 2 * Math.PI, 0, true);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (h.ring !== 'miss') {
      const a1 = start + h.idx * step;
      const a2 = a1 + step;
      let ir, or;
      switch (h.ring) {
        case 'double':
          ir = radii.dblIn;
          or = radii.dblOut;
          break;
        case 'triple':
          ir = radii.triIn;
          or = radii.triOut;
          break;
        case 'singleOut':
          ir = radii.triOut;
          or = radii.dblIn;
          break;
        case 'singleIn':
          ir = radii.bullOut;
          or = radii.triIn;
          break;
      }
      drawSector(ctx, ir, or, a1, a2, col.hl);
      ctx.beginPath();
      ctx.arc(cx, cy, or, a1, a2);
      ctx.arc(cx, cy, ir, a2, a1, true);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  });
  // 尾迹
  trail.forEach((pt, index) => {
    if (now - pt.t0 >= 400) {
      trail.splice(index, 1);
      return;
    }
    const a = 1 - (now - pt.t0) / 400;
    ctx.save();
    ctx.globalAlpha = a * 0.4;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#999';
    ctx.fill();
    ctx.restore();
  });
};

// UI 更新
const updateUI = (sc) => {
  currentScore.value = sc;
  pop('score');

  pop('total');
  if (throwCount.value < 3) {
    throwCount.value++;
  } else {
    throwCount.value = 1;
    round.value++;
  }
};

// 发射
const launch = (x, y) => {
  const hit = getHit(x, y);
  anim = {sx: cx, sy: CS + 60, tx: x, ty: y, t0: performance.now(), dur: 600, hit};
};

// 循环 (核心，封装成函数)
const loop = (ctx, now = 0) => {
  drawBoard(ctx);
  drawEffects(ctx, now);
  if (anim) {
    const t = Math.min((now - anim.t0) / anim.dur, 1);
    const p = 1 - Math.pow(1 - t, 3);
    const x = anim.sx + (anim.tx - anim.sx) * p;
    const y = anim.sy + (anim.ty - anim.sy) * p;
    trail.push({x, y, t0: now});
    drawDart(ctx, x, y);
    if (t >= 1) {
      hls.push({...anim.hit, t0: now, dur: 600});
      updateUI(anim.hit.score);
      anim = null;
    }
  }
  if (ctx.draw) { // 确保 draw 方法存在 (UniApp)
    ctx.draw(true) // 立即执行绘制, 缓存之前的绘制
  }
};

// 事件绑定 & 启动
onMounted(() => {
  // 开启蓝牙数据转发 + 注册回调
  bluetooth().isGameStart = true;
  bluetooth().setScoreCallback(onBleMessage);
  // 精简：移除未使用的选择器查询代码，避免 this 作用域问题
});

// 统一处理触摸事件
const handleCanvasClick = (e) => {
  const {detail} = e;
  const x = detail.x || e.offsetX; // 兼容小程序和 App 的坐标获取方式
  const y = detail.y || e.offsetY;
  launch(x, y);
};

const connect = () => {
  console.log('开始连接');
  bluetooth().connect();
};

const {locale} = useI18n();

const state = reactive({
  teamArray: [], // 队伍数组
  gameSettings: {},
  gameState: {
    currentRound: 1, // 当前回合
    currentTeam: 1, // 当前投掷的队伍
    currentPlayerIndex: 0, // 当前队伍中的玩家索引
    currentDart: 1, // 当前投掷的镖数(1-3)
    maxRounds: 20, // 最大回合数
    roundScores: {}, // 每回合的得分记录
    averageScores: {}, // 每个玩家的平均分记录
    isRoundEnd: false,
    teamSize: 1,
  },
  modeEntity: {},
  hitAreas: {},
  teamLocks: {},
});

const gameCommon = useGameCommon();
const modeName = ref();
const playerContentRef = ref(null);
// 获取路由传递的参数并初始化游戏
onLoad((options) => {
  console.log('options为：' + JSON.stringify(options))
  const params = getParams(options);
  // 初始化游戏状态
  initGameState(params);
});

onReady(() => {

})

onUnmounted(() => {
  bluetooth().isGameStart = false;
  bluetooth().setScoreCallback(null);
})

// 初始化游戏状态
const initGameState = async (params) => {
  if (params.gameSettings.customRound) {
    params.gameSettings.roundNbr = params.gameSettings.customRound
  }
  // 根据team分组玩家
  state.teamArray = params.players;

  // 获取最大的玩家团队
  state.gameState.teamSize = params.gameSettings.teamSize
  state.modeEntity = params.modeEntity

  // 设置游戏设置
  state.gameState.maxRounds = params.gameSettings?.roundNbr || 20;

  // 获取配置
  state.gameSettings = params.gameSettings;

  // 初始化第一个队伍第一个玩家为活动状态
  if (state.teamArray.length > 0 && state.teamArray[0].players.length > 0) {
    state.teamArray[0].players[0].isActive = true;
    state.gameState.currentTeam = state.teamArray[0].team;
  }

  // 初始化回合分数记录
  state.gameState.roundScores = {
    1: {} // 初始化第一回合
  };

  // 初始化每个玩家的平均分记录
  state.teamArray.forEach(team => {
    team.combo = 1;
    team.teamRoundNbr = 0;
    team.currentScore = team.startingScore;
    state.hitAreas[team.team] = {};
    team.players.forEach(player => {
      state.gameState.averageScores[player.id] = [];
    });
  });
  modeName.value = locale.value === 'zh' ? state.modeEntity.chineseModeName : state.modeEntity.englishModeName;

};

const blurScore = (data) => {
  if (data === '65') {
    gameCommon.moveToNextPlayer(state, playerContentRef, null, startOnConfirm)
  } else {
    const gameConfig = getGameConfig(data);
  }
}

const color = ['#5bcf45', '#cd29cd', '#3976d0'];

const startOnConfirm = (activeTeam, activePlayer) => {
  const currentRoundScores = state.gameState.roundScores[state.gameState.currentRound]?.[activeTeam.team]?.[activePlayer.id] || [];
  if (currentRoundScores.length < 3) {
    activeTeam.combo = 1;
  }
}

// 子组件触发 NEXT 时，进入下一位
const handleNextFromBoard = () => {
  gameCommon.moveToNextPlayer(state, playerContentRef, null, startOnConfirm)
}

// 新增方法用于处理用户输入并改变对应区域颜色

</script>

<template>
  <view>
    <!-- 调试面板 -->
<!--    <debug-panel-->
<!--      :current-round="state.gameState.currentRound"-->
<!--      :current-dart="state.gameState.currentDart"-->
<!--      @throw-dart="(data)=>bluetooth().setScoreCallback(data)"-->
<!--    />-->
    <dart-board
      :score-info="scoreInfo"
      :total-score="totalScore"
      :game-state="state.gameState"
      :score-info-change="scoreInfoChange"
      @next="handleNextFromBoard"
    ></dart-board>
  </view>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
}

canvas {
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  cursor: crosshair;
}

.ui {
  margin-top: 12rpx;
  display: flex;
  gap: 24rpx;
  font-size: 18rpx;
  color: #333;
}

.ui div {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.value {
  font-weight: bold;
  color: white;
  transition: transform 0.3s ease;
  display: inline-block;
}

.value.pop {
  transform: scale(1.3);
}

#connet {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
