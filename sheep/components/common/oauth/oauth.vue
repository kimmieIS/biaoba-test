<script setup>
import {OAuthLogin} from "@/sheep/oauth";
import $stores from "@/sheep/stores";

const emit = defineEmits(['onClick']);

const onClick = (code) => {
  emit('onClick', code);
}

const userInfo = $stores('user').getUserInfo();
// 判断当前手机是否为ios
const isIos = uni.getSystemInfoSync().platform === 'ios';
</script>

<template>
  <view class="oauth-box">
    <view class="oauth-btn wechat" @click="onClick('weixin')">
      <image class="uni-w-full uni-h-full" src="@/static/images/oauth/wechat.png" mode="aspectFit"/>
    </view>
	<view class="oauth-btn apple" v-if="isIos" @click="onClick('apple')">
	  <image class="uni-w-full uni-h-full" src="@/static/images/oauth/apple.png" mode="aspectFit"/>
	</view>
    <view class="oauth-btn google"  @click="onClick('google')">
      <image class="uni-w-full uni-h-full" src="@/static/images/oauth/google.png" mode="aspectFit"/>
    </view>
   
  </view>
</template>

<style scoped lang="scss">
.oauth-box {
  display: flex;
  justify-content: space-around;

  .oauth-btn {
    width: 25rpx;
    height: 25rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>