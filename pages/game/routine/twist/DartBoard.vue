<template>
  <view class="container">
    <!-- 添加蓝牙连接按钮 -->
    <view class="bluetooth-btn" :style="uiPositions.bluetoothButton">
      <Bluetooth :size="120" color="#1296db" />
    </view>

    <!-- 侧边统计与控制面板 -->
    <view class="counter-panel" :style="uiPositions.scoreDisplay">
      <view class="remaining">剩余
        <text class="num">{{ remainingCount }}</text>
      </view>
      <view class="btns">
        <button class="next-btn" @click="onNext">Next</button>
        <button class="reset-btn" @click="resetBoard">重置</button>
      </view>
    </view>

    <canvas canvas-id="board" id="board" type="2d" :style="canvasStyle" @touchstart="handleTouch"></canvas>
    
    <!-- 底部状态提示 -->
    <view class="bottom-status">
      <text class="status-text" :class="{ 'status-complete': remainingCount === 0 }">{{ statusMessage }}</text>
    </view>
  </view>
</template>

<script>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import Bluetooth from "@/sheep/components/blue/Bluetooth.vue";
import bluetooth from "@/sheep/stores/bluetooth";
import { useResponsive } from "@/composables/useResponsive";
import { targetConfig } from "@/sheep/config/bluetoothConfig";

export default {
  name: 'DartBoard',
  components: {
    Bluetooth
  },
  emits: ['next'],
  props: {
    scoreInfo: {
      type: Object,
      default: () => ({})
    },
    totalScore: {
      type: Number,
      default: 0
    },
    gameState: {
      type: Object,
      default: () => ({
        currentRound: 1,
        currentDart: 1,
        maxRounds: 20
      })
    },
    scoreInfoChange: {
      type: Number,
      default: 0
    }
  },
  setup(props, { emit }) {
    const board = ref(null);
    let ctx = null; // 存储 canvas 上下文

    // 使用响应式布局
    const {
      viewport,
      config,
      uiPositions,
      canvasStyle,
      updateResponsiveConfig,
      mapTouch
    } = useResponsive();

    // 监听 scoreInfoChange 变化
    watch(() => props.scoreInfoChange, (newVal) => {
      let change = props.scoreInfo;
      if (change && Object.keys(change).length > 0) {
        console.log('DartBoard 收到新的得分信息：', change);
        // 物理 NEXT 键（65）
        if (change.isNext === true || change.code === '65') {
          onNext();
          return;
        }
        highlightHitArea(change);
      }
    }, { deep: true });

    // 响应式常量定义 - 基于响应式配置计算
    const CS = computed(() => config.value.canvasSize); // 画布宽度
    const CH = computed(() => config.value.canvasSize); // 画布高度（保持正方形）
    const cx = computed(() => CS.value / 2); // 水平中心点
    const cy = computed(() => CH.value / 2); // 垂直中心点
    const M = computed(() => CS.value * 0.1); // 边缘留白（10%的画布宽度）
    const R = computed(() => (CS.value / 2) - M.value); // 板面半径

    // 各环半径 - 基于响应式半径计算
    const radii = computed(() => ({
      dblIn: R.value * 0.85,
      dblOut: R.value * 0.92,
      triIn: R.value * 0.55,
      triOut: R.value * 0.6,
      bullOut: R.value * 0.12,
      bullIn: R.value * 0.05,
      glow: R.value * 1.1  // 发光圈半径
    }));

    // 配色
    const col = {
      glowInner: 'rgba(255,255,255,0.6)',
      glowOuter: 'rgba(255,255,255,0)',
      bg0: '#2a2a2a',
      bg1: '#1a1a1a',
      red: '#ff4444',
      grn: '#44ff44',
      brn: '#d4aa70',
      drk: '#333333',
      gold: '#ffd700',
      hl: '#FFFFFF',  // 修改高亮颜色为白色
      hit: 'rgba(255,255,255,0.8)'  // 新增击中效果的颜色
    };

    // 靶号从 20 开始顺时针（20 在正上方）
    const nums = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    const S = 20;
    const step = (2 * Math.PI) / S;
    const start = (-Math.PI / 2) - (step / 2);  // 调整使20的数字正好在正上方

    // 蓝牙相关状态
    const isConnected = ref(false);
    const bluetoothIcon = ref('/static/images/bluetooth.png');

    // 序列：按 20,1,18,... 每个分区 双-外单-三-内单，最后 外牛眼-内牛眼
    const buildSequenceKeys = () => {
      const seq = [];
      (targetConfig || [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5]).forEach(n => {
        seq.push(`${n}-DOUBLE`);
        seq.push(`${n}-SINGLE-OUT`);
        seq.push(`${n}-TRIPLE`);
        seq.push(`${n}-SINGLE-IN`);
      });
      seq.push('BULL-OUTER');
      seq.push('BULL-INNER');
      return seq;
    };
    const sequenceKeys = ref(buildSequenceKeys());
    const currentIndex = ref(0);

    // 测试状态：记录已测试的分区（用于着色）
    const testedFlags = ref({}); // { '20-DOUBLE': true, 'BULL-INNER': true, ... }
    const testedCount = computed(() => currentIndex.value);
    const remainingCount = computed(() => sequenceKeys.value.length - currentIndex.value);

    // 成功反馈：声音 + 轻微震动
    const feedbackSuccess = () => {
      // #ifdef APP-PLUS
      try { plus.device.beep(); } catch (e) {}
      // #endif
      if (typeof uni.vibrateShort === 'function') {
        try { uni.vibrateShort(); } catch (e) {}
      }
    };

    // 根据蓝牙上报信息生成唯一分区键
    const getAreaKeyFromInfo = (info) => {
      if (!info || !info.originalScore) return null;
      const score = parseInt(info.originalScore);
      const multiplier = parseInt(info.multiplier) || 1;
      if (score === 21) {
        // 牛眼：4=内牛眼，5=外牛眼（依据蓝牙协议）
        return multiplier === 4 ? 'BULL-INNER' : 'BULL-OUTER';
      }
      if (multiplier === 3) return `${score}-TRIPLE`;
      if (multiplier === 2) return `${score}-DOUBLE`;
      if (multiplier === 1) {
        const range = info.range === 'in' ? 'SINGLE-IN' : 'SINGLE-OUT';
        return `${score}-${range}`;
      }
      return null;
    };

    // 目标文案
    const formatTargetLabel = (key) => {
      if (!key) return '';
      if (key === 'BULL-OUTER') return '外牛眼';
      if (key === 'BULL-INNER') return '内牛眼';
      const [num, part1, part2] = key.split('-');
      if (part1 === 'DOUBLE') return `${num} 双倍`;
      if (part1 === 'TRIPLE') return `${num} 三倍`;
      if (part1 === 'SINGLE' && part2 === 'OUT') return `${num} 外单`;
      if (part1 === 'SINGLE' && part2 === 'IN') return `${num} 内单`;
      return key;
    };

    // 状态提示信息
    const statusMessage = computed(() => {
      const left = remainingCount.value;
      if (left === 0) {
        return '测试完成，按NEXT键进入下一位';
      } else {
        const target = sequenceKeys.value[currentIndex.value];
        return `请按顺序击打：${formatTargetLabel(target)}（剩余 ${left} 项）`;
      }
    });

    // NEXT按钮处理 - 进入下一位
    const onNext = () => {
      const left = remainingCount.value;
      if (left === 0) {
        // 测试完成，进入下一位
        testedFlags.value = {}; // 清空当前测试记录
        currentIndex.value = 0; // 重置序列
        drawBoard();
        emit('next');
        uni.showToast({
          title: '已进入下一位',
          icon: 'success'
        });
      }
    };

    // 重置按钮处理
    const resetBoard = () => {
      uni.showModal({
        title: '重置测试',
        content: '确定要清空当前测试记录吗？',
        success: (res) => {
          if (res.confirm) {
            testedFlags.value = {}; // 清空当前测试记录
            currentIndex.value = 0; // 重置序列
            drawBoard();
          }
        }
      });
    };

    onMounted(() => {
      // 初始化画布
      nextTick(() => {
        const query = uni.createSelectorQuery().in(this);
        query.select('#board')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res[0]) {
              try {
                ctx = uni.createCanvasContext('board', this);
                console.log('画布上下文初始化成功');
                drawBoard();
              } catch (error) {
                console.error('画布上下文创建失败：', error);
              }
            } else {
              console.error('画布元素未找到');
            }
          });
      });

      // 监听窗口尺寸变化
      uni.onWindowResize(() => {
        console.log('窗口尺寸变化，更新响应式配置');
        updateResponsiveConfig();
        // 延迟重绘以确保配置更新完成
        nextTick(() => {
          if (ctx) {
            drawBoard();
          }
        });
      });
    });

    // 处理触摸事件 - 使用响应式坐标映射
    const handleTouch = (e) => {
      const touch = e.touches[0];
      const screenX = touch.x;
      const screenY = touch.y;

      // 使用响应式坐标映射
      const mappedCoords = mapTouch(screenX, screenY);

      // 转换为画布中心坐标系
      const canvasX = mappedCoords.x + cx.value;
      const canvasY = mappedCoords.y + cy.value;

      launch(canvasX, canvasY);
    };

    const score = ref('--');
    const total = ref(0);
    const round = ref(1);
    const throwCount = ref(1);

    const state = {
      total: total,
      round: round,
      throw: throwCount,
      anim: null,
      trail: [],
      hls: [],
      ctx: null
    };

    // 移除 URLSearchParams，改用页面参数
    const initGameState = () => {
      props.gameState = {
        currentRound: 1,
        currentDart: 1,
        maxRounds: 20,
        totalScore: 0
      };
    };

    // 绘制发光环
    const drawGlow = () => {
      try {
        const grad = ctx.createCircularGradient(cx.value, cy.value, R.value);
        grad.addColorStop(0, col.glowInner);
        grad.addColorStop(1, col.glowOuter);
        ctx.beginPath();
        ctx.arc(cx.value, cy.value, R.value, 0, 2 * Math.PI);
        ctx.setFillStyle(grad);
        ctx.fill();
      } catch (error) {
        console.log('渐变创建失败，使用备选方案');
        // 备选方案：使用纯色
        ctx.beginPath();
        ctx.arc(cx.value, cy.value, R.value, 0, 2 * Math.PI);
        ctx.setFillStyle(col.bg0);
        ctx.fill();
      }
    };

    // 扇区绘制
    const drawSector = (ir, or, a1, a2, fill) => {
      try {
        ctx.beginPath();
        ctx.arc(cx.value, cy.value, or, a1, a2);
        ctx.lineTo(cx.value + Math.cos(a2) * ir, cy.value + Math.sin(a2) * ir);
        ctx.arc(cx.value, cy.value, ir, a2, a1, true);
        ctx.lineTo(cx.value + Math.cos(a1) * or, cy.value + Math.sin(a1) * or);
        ctx.setFillStyle(fill);
        ctx.fill();
      } catch (error) {
        console.error('扇区绘制失败:', error);
      }
    };

    // 主绘制函数
    const drawBoard = () => {
      if (!ctx) return;

      // 清除画布
      ctx.clearRect(0, 0, CS.value, CH.value);

      // 绘制发光效果
      drawGlow();

      // 绘制背景
      ctx.beginPath();
      ctx.arc(cx.value, cy.value, R.value, 0, 2 * Math.PI);
      ctx.setFillStyle(col.bg0);
      ctx.fill();

      // 绘制得分区域（根据testedFlags决定是否着紫色）
      for (let i = 0; i < S; i++) {
        const a1 = start + i * step;
        const a2 = a1 + step;
        const num = nums[i];

        // 预计算分区键
        const keyDouble = `${num}-DOUBLE`;
        const keyTriple = `${num}-TRIPLE`;
        const keySingleOut = `${num}-SINGLE-OUT`;
        const keySingleIn = `${num}-SINGLE-IN`;

        const testedColor = 'rgba(128,0,128,0.85)';

        // 双倍区
        const colorDouble = testedFlags.value[keyDouble] ? testedColor : (i % 2 ? col.red : col.grn);
        drawSector(radii.value.dblIn, radii.value.dblOut, a1, a2, colorDouble);

        // 外单区
        const colorSingleOut = testedFlags.value[keySingleOut] ? testedColor : (i % 2 ? col.brn : col.drk);
        drawSector(radii.value.triOut, radii.value.dblIn, a1, a2, colorSingleOut);

        // 三倍区
        const colorTriple = testedFlags.value[keyTriple] ? testedColor : (i % 2 ? col.red : col.grn);
        drawSector(radii.value.triIn, radii.value.triOut, a1, a2, colorTriple);

        // 内单区
        const colorSingleIn = testedFlags.value[keySingleIn] ? testedColor : (i % 2 ? col.brn : col.drk);
        drawSector(radii.value.bullOut, radii.value.triIn, a1, a2, colorSingleIn);

        // 绘制数字
        const ang = start + (i + 0.5) * step;
        const r = R.value + 20;
        const x = cx.value + Math.cos(ang) * r;
        const y = cy.value + Math.sin(ang) * r;

        ctx.setFontSize(18);
        ctx.setFillStyle('#FFFFFF');
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText(nums[i].toString(), x, y);
      }

      // 绘制靶心（根据testedFlags着色）
      const isBullOuterTested = !!testedFlags.value['BULL-OUTER'];
      const isBullInnerTested = !!testedFlags.value['BULL-INNER'];
      const testedColor = 'rgba(128,0,128,0.85)';

      ctx.beginPath();
      ctx.arc(cx.value, cy.value, radii.value.bullOut, 0, 2 * Math.PI);
      ctx.setFillStyle(isBullOuterTested ? testedColor : col.red);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx.value, cy.value, radii.value.bullIn, 0, 2 * Math.PI);
      ctx.setFillStyle(isBullInnerTested ? testedColor : col.grn);
      ctx.fill();

      // 调用draw使绘制生效
      ctx.draw(true);
	  console.log("99999")
    };

    const getHit = (x, y) => {
      const dx = x - cx.value, dy = y - cy.value, r = Math.hypot(dx, dy);
      if (r <= radii.value.bullIn) return { ring: 'innerBull', score: 50 };
      if (r <= radii.value.bullOut) return { ring: 'outerBull', score: 25 };
      let ang = Math.atan2(dy, dx) - start;
      if (ang < 0) ang += 2 * Math.PI;
      const idx = Math.floor(ang / step), base = nums[idx];
      if (r <= radii.value.triIn) return { ring: 'singleIn', score: base, idx };
      if (r <= radii.value.triOut) return { ring: 'triple', score: base * 3, idx };
      if (r <= radii.value.dblIn) return { ring: 'singleOut', score: base, idx };
      if (r <= radii.value.dblOut) return { ring: 'double', score: base * 2, idx };
      return { ring: 'miss', score: 0 };
    };

    const drawDart = (x, y) => {
      const ctx = board.value.getContext('2d');
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
        const t = i * 2 * Math.PI / 3 + Math.PI;
        ctx.beginPath();
        ctx.moveTo(-48, 0);
        ctx.lineTo(-48 + 12 * Math.cos(t + 0.3), 12 * Math.sin(t + 0.3));
        ctx.lineTo(-48 + 12 * Math.cos(t - 0.3), 12 * Math.sin(t - 0.3));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    const drawEffects = (now) => {
      // 高亮淡出
      state.hls = state.hls.filter(h => {
        let t = (now - h.t0) / h.dur;
        if (t > 1) return false;
        const ctx = board.value.getContext('2d');
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.4;
        ctx.fillStyle = col.hl;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        if (h.ring.startsWith('inner') || h.ring.startsWith('outer')) {
          const r = h.ring === 'innerBull' ? radii.value.bullIn : radii.value.bullOut;
          ctx.beginPath();
          ctx.arc(cx.value, cy.value, r, 0, 2 * Math.PI);
          if (h.ring === 'outerBull') {
            ctx.arc(cx.value, cy.value, radii.value.bullIn, 2 * Math.PI, 0, true);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (h.ring !== 'miss') {
          const a1 = start + h.idx * step, a2 = a1 + step;
          let ir, or;
          switch (h.ring) {
            case 'double':
              ir = radii.value.dblIn;
              or = radii.value.dblOut;
              break;
            case 'triple':
              ir = radii.value.triIn;
              or = radii.value.triOut;
              break;
            case 'singleOut':
              ir = radii.value.triOut;
              or = radii.value.dblIn;
              break;
            case 'singleIn':
              ir = radii.value.bullOut;
              or = radii.value.triIn;
              break;
          }
          drawSector(ir, or, a1, a2, col.hl);
          ctx.beginPath();
          ctx.arc(cx.value, cy.value, or, a1, a2);
          ctx.arc(cx.value, cy.value, ir, a2, a1, true);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
        return true;
      });
      // 尾迹
      state.trail = state.trail.filter(pt => now - pt.t0 < 400);
      state.trail.forEach(pt => {
        const a = 1 - (now - pt.t0) / 400;
        const ctx = board.value.getContext('2d');
        ctx.save();
        ctx.globalAlpha = a * 0.4;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#999';
        ctx.fill();
        ctx.restore();
      });
    };

    const updateUI = (sc) => {
      score.value = sc;
      state.total.value += sc;
      if (state.throw.value < 3) state.throw.value++;
      else {
        state.throw.value = 1;
        state.round.value++;
      }
    };

    const launch = (x, y) => {
      const hit = getHit(x, y);
      state.anim = { sx: cx.value, sy: CH.value + 50, tx: x, ty: y, t0: Date.now(), dur: 600, hit };
    };

    const loop = (now = Date.now()) => {
      if (!ctx) return; // 确保 ctx 存在

      drawBoard();
      drawEffects(now);

      if (state.anim) {
        const t = Math.min((now - state.anim.t0) / state.anim.dur, 1),
          p = 1 - Math.pow(1 - t, 3),
          x = state.anim.sx + (state.anim.tx - state.anim.sx) * p,
          y = state.anim.sy + (state.anim.ty - state.anim.sy) * p;
        state.trail.push({ x, y, t0: now });
        drawDart(x, y);
        if (t >= 1) {
          state.hls.push({ ...state.anim.hit, t0: now, dur: 600 });
          updateUI(state.anim.hit.score);
          state.anim = null;
        }
      }


    };


    // 高亮显示击中区域（一次命中即标记为紫色并计数）
    const highlightHitArea = (info) => {
      const key = getAreaKeyFromInfo(info);
      if (!key) return;

      const expected = sequenceKeys.value[currentIndex.value];
      if (key !== expected) {
        // 顺序不对，忽略
        return;
      }

      if (!testedFlags.value[key]) {
        testedFlags.value[key] = true; // 标记当前步骤完成
        feedbackSuccess();            // 声音/震动提示
      }
      // 推进到下一目标
      if (currentIndex.value < sequenceKeys.value.length) {
        currentIndex.value += 1;
      }

      // 重新绘制，让已命中分区显示为紫色
      drawBoard();
    };

    // 监听蓝牙连接状态
    watch(() => bluetooth().isConnected, (newVal) => {
      console.log('蓝牙连接状态：', newVal);
    });

    return {
      board,
      score,
      total,
      round,
      throwCount,
      handleTouch,
      highlightHitArea,
      // 新增蓝牙相关
      isConnected,
      bluetoothIcon,
      gameState: computed(() => props.gameState),
      totalScore: computed(() => props.totalScore),
      // 响应式相关
      canvasStyle,
      config,
      viewport,
      uiPositions,
      remainingCount,
      statusMessage,
      onNext,
      resetBoard
    };
  }
};
</script>

<style lang="scss">
.container {
  width: 100vw;
  height: 100vh;
  background-color: #170746;
  position: relative;

  .bluetooth-btn {
    z-index: 999;
    padding: 20rpx;

:deep(.uni-img) {
      width: 120rpx;
      height: 120rpx;
    }
  }

  .counter-panel {
    position: fixed;
    top: calc(var(--status-bar-height) + 20rpx);
    right: 30rpx;
    z-index: 999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10rpx;

    .remaining {
      color: #fff;
      font-size: 26rpx;
      .num {
        display: inline-block;
        min-width: 60rpx;
        text-align: center;
        font-size: 42rpx;
        font-weight: 700;
        color: #FFD700;
        margin-left: 10rpx;
      }
    }
    .btns {
      display: flex;
      gap: 10rpx;
    }
    .next-btn {
      background: #2ed573;
      color: #fff;
      border: none;
      border-radius: 12rpx;
      padding: 12rpx 20rpx;
      font-size: 26rpx;
    }
    .reset-btn {
      background: #ff4757;
      color: #fff;
      border: none;
      border-radius: 12rpx;
      padding: 12rpx 20rpx;
      font-size: 26rpx;
    }
  }

  .game-info {
    position: fixed;
    top: calc(var(--status-bar-height) + 20rpx);
    right: 30rpx;
    z-index: 999;
    padding: 20rpx;
    color: #fff;
    text-align: right;

    .score {
      font-size: 48rpx;
      font-weight: bold;
      margin-bottom: 10rpx;
    }

    .round-info {
      font-size: 24rpx;
      opacity: 0.8;
    }
  }

  #board {
    background: transparent;
  }

  .bottom-status {
    position: fixed;
    bottom: 12%;
    left: 0;
    right: 0;
    text-align: center;
    z-index: 999;
    padding: 0 40rpx;

    .status-text {
      display: inline-block;
      background: rgba(255, 87, 87, 0.9);
      color: #fff;
      font-size: 28rpx;
      font-weight: 500;
      padding: 16rpx 40rpx;
      border-radius: 50rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;

      &.status-complete {
        background: rgba(46, 213, 115, 0.9);
      }
    }
  }
}
</style>
