<script setup>
import {ref} from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: '加载中...'
  },
  mask: {
    type: Boolean,
    default: true
  }
});
</script>

<template>
  <view v-if="show" class="loading-container" :class="{ 'with-mask': mask }">
    <view class="loading-content">
      <view class="loading-box">
        <!-- 加载动画 -->
        <view class="loading-spinner">
          <view class="spinner-circle"></view>
        </view>
        <!-- 加载文本 -->
        <text class="loading-text">{{ text }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;

  &.with-mask {
    background-color: rgba(0, 0, 0, 0.6);
  }
}

.loading-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-box {
  border-radius: 10rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  min-width: 200rpx;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top: 3rpx solid #8856FF;
  border-radius: 50%;
  animation: spin 1s infinite linear;
  box-sizing: border-box;
}

.loading-text {
  color: #FFFFFF;
  font-size: 18rpx;
  text-align: center;
  line-height: 1;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 