<script setup>
import PopBackground from "@/sheep/components/common/popBackground.vue";

const props = defineProps({
  text: {
    type: String,
    default: '按钮'
  }
})
const emit = defineEmits(['onClick'])
</script>

<template>
  <view class="button" @click="emit('onClick')">
    <pop-background>
      <view class="button-text">{{text}}</view>
    </pop-background>
  </view>
</template>

<style scoped>
.button {
  width: 100%;
  height: 40rpx;
  display: flex;
  align-content: center;
  align-items: center;
}

.button-text {
  font-size: 16rpx;
  font-weight: 400;
  color: #FFFFFF;
  text-align: center;
  font-style: normal;
  text-transform: none;
  -webkit-text-stroke: 0.7rpx #8856FF;
}
</style>