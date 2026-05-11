<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  number: {
    type: [Number, String],
    required: true
  },
  height: {
    type: Number,
    default: 40
  }
});

// 将数字转换为数组
const numberArray = ref([]);

// 处理数字，确保在1-1000范围内
const processNumber = (num) => {
  // 转换为数字
  let value = Number(num);
  // 限制范围
  value = Math.max(0, Math.min(value, 1000)); // 修复了原代码中的 Math.min 参数缺失问题
  // 转换为字符串数组
  return String(value).split('').map(Number);
};

// 初始化和更新数字
watch(() => props.number, (newVal,oldValue) => {
  numberArray.value = processNumber(newVal);
  animateNumber(newVal,oldValue)
}, { immediate: true });

// 新增：按钮点击事件
const animateNumber = (newVal,oldValue) => {
  let currentNumber = oldValue;
  const interval = setInterval(() => {
    if (currentNumber <=newVal ) {    //随机次数
      clearInterval(interval);
      return;
    }
    currentNumber--;

    numberArray.value = processNumber(currentNumber);
  }, 18); // 每10毫秒更新一次数字
};
</script>

<template>
  <view class="number-roll-container">
    <view
        v-for="(digit, index) in numberArray"
        :key="index"
        class="digit-wrapper"
        :style="{ height: `${height}rpx`, width: `${height}rpx` }"
    >
      <image
          :src="`/static/images/figure/${digit}.png`"
          :style="{ height: `${height}rpx`, width: `${height}rpx` }"
          mode="aspectFit"
      />
    </view>
  </view>
  <!-- 新增：按钮 -->
<!--  <button @click="animateNumber">点击变化</button>-->
</template>

<style scoped>
.number-roll-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.digit-wrapper {
  transform: scale(1.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 新增：按钮样式 */
button {
  margin-top: 20rpx;
  padding: 10rpx 20rpx;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5rpx;
}
</style>