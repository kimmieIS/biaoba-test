<script setup>
import { ref, computed, onUnmounted } from "vue";
import PopUpLayer from "@/sheep/components/util/popUp/popUpLayer.vue";
import messageToastStore from "@/sheep/stores/message";
import {decodeHTML} from "entities";

// 状态管理
const title = ref("");
const message = ref("");
const duration = ref(1500);
const isSticky = ref(false);
const isShow = ref(false);
const isActive = ref(false);

// 定时器引用，用于清理重复的 `setTimeout`
let hideTimer = null;

// 监听全局 Store 的状态
const visible = computed(() => {
  if (messageToastStore().visible) {
    showToast(messageToastStore().$state);
  } else {
    hideToast();
  }
  return messageToastStore().visible;
});

// 显示 Toast
const showToast = (options) => {
  // 清理之前的定时器
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  if (typeof options === "string") {
    message.value = options;
    title.value = "";
    isSticky.value = false;
  } else {
    title.value = options.title || "";
    message.value = options.message || "";
    duration.value = options.duration || 1500;
    isSticky.value = options.isSticky || false;
  }

  // 更新显示状态
  isShow.value = true;

  // 添加动画
  setTimeout(() => {
    isActive.value = true;
  }, 50);

  // 自动隐藏
  if (!isSticky.value) {
    hideTimer = setTimeout(() => {
      hideToast();
    }, duration.value);
  }
};

// 隐藏 Toast
const hideToast = () => {
  // 移除动画状态
  isActive.value = false;

  // 等待动画完成后隐藏元素
  setTimeout(() => {
    isShow.value = false;
    messageToastStore().visible = false;
    // 重置状态
    title.value = "";
    message.value = "";
    isSticky.value = false;
  }, 300);
};

// 清理定时器（组件卸载时）
onUnmounted(() => {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
});

// 暴露方法给外部
defineExpose({
  showToast,
  hideToast,
});
</script>

<template>
  <view v-show="isShow" style="z-index: 9999">
    <PopUpLayer
        v-if="visible"
        :title="title"
        :modalVisible="visible"
        :confirm="false"
        :cancel="false"
        :mask="false"
        width="auto"
        :height="isSticky ? '80%' : 'auto'"
        :show-close="isSticky"
        @close="hideToast"
    >
      <view class="toast-container" :class="{ 'toast-show': isActive }">
        <view class="toast-content">
          <scroll-view
              scroll-y="true"
              class="toast-scroll"
              :style="{ maxHeight: isSticky ? 'calc(64vh)' : '40vh' }"
          >
<!--            <text class="toast-message">{{ message }}</text>-->
            <div class="toast-message" v-html='message'></div>
          </scroll-view>
        </view>
      </view>
    </PopUpLayer>
  </view>
</template>

<style scoped lang="scss">
.toast-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transform: translateY(-20rpx);
  transition: all 0.3s ease;
  will-change: opacity, transform;
}

.toast-show {
  opacity: 1;
  transform: translateY(0);
}

.toast-content {
  width: 100%;
  box-sizing: border-box;
}

.toast-scroll {
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.toast-message {
  display: block;
  color: #fff;
  text-align: left;
  word-break: break-word;
  white-space: pre-wrap;
  font-size: 14rpx;
  line-height: 1.5;
}
</style>