<script setup>

</script>

<template>
  <view class="without">
    <view class="part box">
      <view class="part-footer"></view>
      <view class="uni-w-full uni-h-full center" style="padding: 10rpx">
        <slot ></slot>
      </view>
    </view>
  </view>
</template>

<style scoped>
.box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.part {
  position: relative;


  &::after {
    position: absolute;
    top: 0;
    right: 0;
    content: '';
    width: 30%;
    height: 15rpx;
    border-right: 3rpx solid #b093ff;
    border-top-right-radius: 5rpx;
    border-top: 3rpx solid #b093ff;
  }

  .part-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;

    &::before {
      position: absolute;
      bottom: 0;
      left: 0;
      content: '';
      width: 30%;
      height: 15rpx;
      border-bottom-left-radius: 5rpx;
      border-left: 3rpx solid #b093ff;
      border-bottom: 3rpx solid #b093ff;
    }

  }
}

.without {
  position: relative;
  width: 100%;
  overflow: hidden;
  background-color: transparent;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  border-radius: 8rpx;
  box-sizing: border-box;
  box-shadow: inset 0 0 34rpx 1rpx rgba(137, 87, 255, 0.45);
  border: 3rpx solid #b093ff;
  color: white;
  font-size: 14rpx;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 5rpx;
}
</style>