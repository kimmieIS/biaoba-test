<!-- DartBoard.vue - 修复版 -->
<template>
  <view class="container">
    <!-- 添加蓝牙连接按钮 -->
    <view class="bluetooth-btn" :style="uiPositions?.bluetoothButton || {}">
      <Bluetooth :size="120" color="#1296db" />
    </view>

    <!-- 侧边统计与控制面板 -->
    <view class="counter-panel" :style="uiPositions?.scoreDisplay || {}">
      <view class="remaining">剩余
        <text class="num">{{ remainingCount }}</text>
      </view>
      <view class="btns">
        <button class="next-btn" @click="onNext">Next</button>
        <button class="reset-btn" @click="resetBoard">重置</button>
      </view>
    </view>

    <canvas canvas-id="board" id="board" :style="canvasStyle" @touchstart="handleTouch"></canvas>
    
    <!-- 底部状态提示 -->
    <view class="bottom-status">
      <text class="status-text" :class="{ 'status-complete': remainingCount === 0 }">{{ statusMessage }}</text>
    </view>
  </view>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
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
    let ctx = null;
    let redrawTimer = null;

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
        if (change.isNext === true || change.code === '65') {
          onNext();
          return;
        }
        highlightHitArea(change);
      }
    }, { deep: true });

    // 响应式常量定义 - 基于响应式配置计算
    const CS = computed(() => config.value?.canvasSize || 300);
    const CH = computed(() => config.value?.canvasSize || 300);
    const cx = computed(() => CS.value / 2);
    const cy = computed(() => CH.value / 2);
    const M = computed(() => CS.value * 0.1);
    const R = computed(() => (CS.value / 2) - M.value);

    // 各环半径 - 基于响应式半径计算
    const radii = computed(() => ({
      dblIn: R.value * 0.85,
      dblOut: R.value * 0.92,
      triIn: R.value * 0.55,
      triOut: R.value * 0.6,
      bullOut: R.value * 0.12,
      bullIn: R.value * 0.05,
      glow: R.value * 1.1
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
      hl: '#FFFFFF',
      hit: '#9b59b6',
	  // hit: 'rgba(255,255,255,0.8)'  // 新增击中效果的颜色
    };

    // 靶号从 20 开始顺时针
    const nums = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    const S = 20;
    const step = (2 * Math.PI) / S;
    const start = (-Math.PI / 2) - (step / 2);

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
    const testedFlags = ref({});
    const testedCount = computed(() => currentIndex.value);
    const remainingCount = computed(() => sequenceKeys.value.length - currentIndex.value);

    // 成功反馈
    const feedbackSuccess = () => {
      try { uni.vibrateShort({ type: 'medium' }); } catch (e) {}
    };

    // 根据蓝牙上报信息生成唯一分区键
    const getAreaKeyFromInfo = (info) => {
      if (!info || !info.originalScore) return null;
      const score = parseInt(info.originalScore);
      const multiplier = parseInt(info.multiplier) || 1;
      if (score === 21) {
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

    // 绘制发光环
    const drawGlow = () => {
      if (!ctx) return;
      try {
        const grad = ctx.createCircularGradient(cx.value, cy.value, R.value);
        grad.addColorStop(0, col.glowInner);
        grad.addColorStop(1, col.glowOuter);
        ctx.beginPath();
        ctx.arc(cx.value, cy.value, R.value, 0, 2 * Math.PI);
        ctx.setFillStyle(grad);
        ctx.fill();
      } catch (error) {
        ctx.beginPath();
        ctx.arc(cx.value, cy.value, R.value, 0, 2 * Math.PI);
        ctx.setFillStyle(col.bg0);
        ctx.fill();
      }
    };

    // 扇区绘制
    const drawSector = (ir, or, a1, a2, fill) => {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(cx.value, cy.value, or, a1, a2);
      ctx.lineTo(cx.value + Math.cos(a2) * ir, cy.value + Math.sin(a2) * ir);
      ctx.arc(cx.value, cy.value, ir, a2, a1, true);
      ctx.setFillStyle(fill);
      ctx.fill();
    };

    // 主绘制函数
    const drawBoard = () => {
      if (!ctx) {
        console.log('ctx 未初始化');
        return;
      }

      const canvasSize = CS.value;
      if (canvasSize <= 0) return;

      ctx.clearRect(0, 0, canvasSize, canvasSize);
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

        const keyDouble = `${num}-DOUBLE`;
        const keyTriple = `${num}-TRIPLE`;
        const keySingleOut = `${num}-SINGLE-OUT`;
        const keySingleIn = `${num}-SINGLE-IN`;

        const testedColor = col.hit;

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
      const testedColor = col.hit;

      ctx.beginPath();
      ctx.arc(cx.value, cy.value, radii.value.bullOut, 0, 2 * Math.PI);
      ctx.setFillStyle(isBullOuterTested ? testedColor : col.red);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx.value, cy.value, radii.value.bullIn, 0, 2 * Math.PI);
      ctx.setFillStyle(isBullInnerTested ? testedColor : col.grn);
      ctx.fill();

      // 高亮当前需要击打的目标区域
      const currentKey = sequenceKeys.value[currentIndex.value];
      if (currentKey && !testedFlags.value[currentKey]) {
        if (currentKey === 'BULL-OUTER') {
          ctx.beginPath();
          ctx.arc(cx.value, cy.value, radii.value.bullOut, 0, 2 * Math.PI);
          ctx.setFillStyle('rgba(255, 215, 0, 0.3)');
          ctx.fill();
        } else if (currentKey === 'BULL-INNER') {
          ctx.beginPath();
          ctx.arc(cx.value, cy.value, radii.value.bullIn, 0, 2 * Math.PI);
          ctx.setFillStyle('rgba(255, 215, 0, 0.3)');
          ctx.fill();
        } else {
          const parts = currentKey.split('-');
          const num = parseInt(parts[0]);
          const sectorIndex = nums.indexOf(num);
          if (sectorIndex !== -1) {
            const a1 = start + sectorIndex * step;
            const a2 = a1 + step;
            
            let innerR, outerR;
            switch (parts[1]) {
              case 'DOUBLE':
                innerR = radii.value.dblIn;
                outerR = radii.value.dblOut;
                break;
              case 'TRIPLE':
                innerR = radii.value.triIn;
                outerR = radii.value.triOut;
                break;
              case 'SINGLE':
                if (parts[2] === 'OUT') {
                  innerR = radii.value.triOut;
                  outerR = radii.value.dblIn;
                } else {
                  innerR = radii.value.bullOut;
                  outerR = radii.value.triIn;
                }
                break;
              default:
                return;
            }
            drawSector(innerR, outerR, a1, a2, 'rgba(255, 215, 0, 0.35)');
          }
        }
      }

      ctx.draw(true);
      console.log('飞镖盘绘制完成');
    };

    // 延迟重绘
    const scheduleRedraw = () => {
      if (redrawTimer) clearTimeout(redrawTimer);
      redrawTimer = setTimeout(() => {
        if (ctx) {
          drawBoard();
        }
      }, 16);
    };

    // 高亮显示击中区域（命中后变紫色）
    const highlightHitArea = (info) => {
      const key = getAreaKeyFromInfo(info);
      if (!key) {
        console.log('无法解析区域键:', info);
        return;
      }

      const expected = sequenceKeys.value[currentIndex.value];
      console.log(`命中区域: ${key}, 期望区域: ${expected}`);

      if (key !== expected) {
        console.log('顺序不对，忽略');
        uni.vibrateShort({ type: 'heavy' });
        return;
      }

      if (!testedFlags.value[key]) {
        testedFlags.value[key] = true;
        feedbackSuccess();
        console.log(`标记命中: ${key}，变为紫色`);
      }
      
      if (currentIndex.value < sequenceKeys.value.length) {
        currentIndex.value += 1;
      }

      scheduleRedraw();
    };

    // 触摸事件处理
    const handleTouch = (e) => {
      const touch = e.touches[0];
      const screenX = touch.x;
      const screenY = touch.y;

      const mappedCoords = mapTouch(screenX, screenY);
      const canvasX = mappedCoords.x + cx.value;
      const canvasY = mappedCoords.y + cy.value;

      const dx = canvasX - cx.value;
      const dy = canvasY - cy.value;
      const dist = Math.hypot(dx, dy);
      const r = radii.value;
      
      let key = null;
      
      if (dist <= r.bullIn) {
        key = 'BULL-INNER';
      } else if (dist <= r.bullOut) {
        key = 'BULL-OUTER';
      } else if (dist <= r.dblOut) {
        let angle = Math.atan2(dy, dx) - start;
        if (angle < 0) angle += 2 * Math.PI;
        const idx = Math.floor(angle / step) % S;
        const num = nums[idx];
        
        if (dist <= r.triIn) {
          key = `${num}-SINGLE-IN`;
        } else if (dist <= r.triOut) {
          key = `${num}-TRIPLE`;
        } else if (dist <= r.dblIn) {
          key = `${num}-SINGLE-OUT`;
        } else {
          key = `${num}-DOUBLE`;
        }
      }
      
      if (key) {
        const mockInfo = { originalScore: key.split('-')[0], multiplier: 1, range: 'out' };
        if (key.includes('DOUBLE')) mockInfo.multiplier = 2;
        if (key.includes('TRIPLE')) mockInfo.multiplier = 3;
        if (key.includes('SINGLE-IN')) { mockInfo.multiplier = 1; mockInfo.range = 'in'; }
        if (key.includes('SINGLE-OUT')) { mockInfo.multiplier = 1; mockInfo.range = 'out'; }
        if (key === 'BULL-INNER') { mockInfo.originalScore = 21; mockInfo.multiplier = 4; }
        if (key === 'BULL-OUTER') { mockInfo.originalScore = 21; mockInfo.multiplier = 5; }
        
        highlightHitArea(mockInfo);
      }
    };

    // NEXT按钮处理
    const onNext = () => {
      if (remainingCount.value === 0) {
        testedFlags.value = {};
        currentIndex.value = 0;
        scheduleRedraw();
        emit('next');
        uni.showToast({
          title: '已进入下一位',
          icon: 'success'
        });
      } else {
        uni.showToast({
          title: `请先完成剩余 ${remainingCount.value} 项`,
          icon: 'none'
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
            testedFlags.value = {};
            currentIndex.value = 0;
            scheduleRedraw();
            uni.showToast({ title: '已重置', icon: 'success' });
          }
        }
      });
    };

    // 初始化画布
    const initCanvas = () => {
      // 获取当前组件实例
      const component = this;
      
      // 使用 setTimeout 确保 DOM 已渲染
      setTimeout(() => {
        try {
          ctx = uni.createCanvasContext('board', component);
          console.log('画布上下文创建成功');
          
          // 延迟绘制，确保画布准备就绪
          setTimeout(() => {
            drawBoard();
          }, 200);
        } catch (error) {
          console.error('画布上下文创建失败：', error);
          // 降级方案
          ctx = uni.createCanvasContext('board');
          setTimeout(() => {
            drawBoard();
          }, 200);
        }
      }, 100);
    };

    // 监听窗口尺寸变化
    const handleResize = () => {
      updateResponsiveConfig();
      setTimeout(() => {
        if (ctx) {
          drawBoard();
        }
      }, 100);
    };

    onMounted(() => {
      nextTick(() => {
        initCanvas();
      });
      uni.onWindowResize(handleResize);
    });

    onUnmounted(() => {
      if (redrawTimer) clearTimeout(redrawTimer);
      uni.offWindowResize(handleResize);
    });

    return {
      board: null,
      score: ref(0),
      total: ref(0),
      round: ref(1),
      throwCount: ref(1),
      handleTouch,
      highlightHitArea,
      isConnected,
      bluetoothIcon,
      gameState: computed(() => props.gameState),
      totalScore: computed(() => props.totalScore),
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