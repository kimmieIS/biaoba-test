<script setup>

const emit = defineEmits(['onClick'])
const hasOnClick = () => {
  emit('onClick')
}
</script>

<template>
  <view class="back-button" @click="hasOnClick">
    <image class="uni-w-full uni-h-full uni-img-scale1-5" src="@/static/images/back.png" mode="aspectFill"/>
  </view>
</template>

<style scoped lang="scss">
// 返回按钮
.back-button {
  position: fixed;
  top: 15rpx;
  left: 15rpx;
  z-index: 100;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>