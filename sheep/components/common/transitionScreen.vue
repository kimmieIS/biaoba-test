<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 1500 // 动画持续时间，默认1.5秒
  }
});

const emit = defineEmits(['update:show', 'finish']);

const isVisible = ref(false);
const isAnimating = ref(false);

// 动态计算字体大小
const dynamicFontSize = computed(() => {
  const length = props.text.length;
  if (length <= 10) return '60rpx'; // 默认字体大小
  if (length <= 20) return '50rpx';
  if (length <= 30) return '40rpx';
  if (length <= 40) return '30rpx';
  if (length <= 50) return '20rpx';
  return '15rpx'; // 如果文字太长，则进一步缩小字体
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    startAnimation();
  }
});

const startAnimation = () => {
  isVisible.value = true;
  isAnimating.value = true;

  setTimeout(() => {
    isAnimating.value = false;
    setTimeout(() => {
      isVisible.value = false;
      emit("update:show", false);
      emit('finish');
    }, 300); // 淡出动画时间
  }, props.duration);
};
</script>

<template>
  <view v-if="isVisible"
        class="transition-screen"
        :class="{
          'animate-in': isAnimating,
          'animate-out': !isAnimating
        }">
    <view class="content">
      <view class="title neon-text" :style="{ fontSize: dynamicFontSize }">{{ text }}</view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.transition-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(75, 0, 130, 0.95), rgba(60, 0, 100, 0.95));
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transform: translateX(-100%); // 初始位置在左侧

  .content {
    transform: scale(0.8);
    transition: transform 0.3s ease;

    .title {
      font-weight: bold;
      text-align: center;
      white-space: nowrap;
      padding: 20rpx;
    }
  }

  &.animate-in {
    animation: slideInFromLeft 0.5s ease forwards;

    .content {
      transform: scale(1);
    }
  }

  &.animate-out {
    animation: slideOutToRight 0.3s ease forwards;

    .content {
      transform: scale(1.2);
    }
  }
}

.neon-text {
  color: #F0C422;
  text-shadow:
      0 0 10rpx rgba(240, 196, 34, 0.8),
      0 0 20rpx rgba(240, 196, 34, 0.6),
      0 0 30rpx rgba(240, 196, 34, 0.4),
      0 0 40rpx rgba(240, 196, 34, 0.2);
}

@keyframes slideInFromLeft {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutToRight {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>