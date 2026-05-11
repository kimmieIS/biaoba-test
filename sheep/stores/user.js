import {defineStore} from 'pinia';
import player from "@/sheep/api/dart/player";
import router from "@/sheep/router";

const useAuthStore = defineStore('user', {
        state: () => ({
            token: uni.getStorageSync('token') || '',
            userInfo: uni.getStorageSync('userInfo') || null,
            isLogin: !!uni.getStorageSync('token'),
			zeGoToken : uni.getStorageSync('zeGoToken') || null,
            lastUpdateTime: 0, // 上次更新时间
        }),
        actions: {
            /**
             * 初始化用户数据，应用启动时调用
             */
            async initAuth() {
                const storedToken = null
                const storedUserInfo = null
				const zeGoToken = null
                if (storedToken) {
                    this.token = null
                    this.isLogin = true;
                    if (storedUserInfo) {
                        this.userInfo = storedUserInfo;
                    } else {
                        // this.userInfo = await this.getInfo();
                    }
                    return true;
                } else {
                    // 确保未登录状态干净
                    this.clearUserInfo();
                    return false;
                }
            },
            setToken(token, refreshToken,zeGoToken,zeGoTokenThird) {
                this.token = token;
                this.isLogin = !!token;
                if (token === '') {
                    this.isLogin = false;
                    uni.removeStorageSync('token');
                    uni.removeStorageSync('refresh-token');
					uni.removeStorageSync('zeGoToken');
                } else {
                    this.isLogin = true;
                    // 持久化存储
                    uni.setStorageSync('token', token);
					 uni.setStorageSync('zeGoToken', zeGoToken);
					 uni.setStorageSync('zeGoTokenThird', zeGoTokenThird);
                    uni.setStorageSync('refresh-token', refreshToken);
                    this.loginAfter();
                }
                return this.isLogin;
            },
            getUserInfo() {
                return this.userInfo;
            },
            // 设置用户信息（支持游客模式）
            setUserInfo(userInfo) {
                this.userInfo = userInfo;
                if (userInfo && userInfo.isGuest) {
                    // 游客模式，不设置token但标记为已登录
                    this.isLogin = true;
                    uni.setStorageSync('userInfo', userInfo);
                } else {
                    uni.setStorageSync('userInfo', userInfo);
                }
                return this.userInfo;
            },
            logout() {
                this.clearUserInfo();
                router.go('/pages/index/index?jumpType=no');
            },
            // 清空登陆信息
            clearUserInfo() {
                this.token = '';
                this.userInfo = null;
                this.isLogin = false;
                uni.removeStorageSync('token');
                uni.removeStorageSync('userInfo');
				uni.removeStorageSync('zeGoToken');
            },
            // 登录后，加载各种信息
            async loginAfter() {
                await this.updateUserData();
            },
            // 更新用户相关信息 (手动限流，5 秒之内不刷新)
            async updateUserData() {
                if (!this.isLogin) {
                    this.logout();
                    return;
                }
                // 防抖，5 秒之内不刷新
                const nowTime = new Date().getTime();
                if (this.lastUpdateTime + 5000 > nowTime) {
                    return;
                }
                this.lastUpdateTime = nowTime;

                // 获取最新信息
                await this.getInfo();
                return this.userInfo;
            },
            async getInfo() {
                this.userInfo = await player.Api.getInfo();
                uni.setStorageSync('userInfo', this.userInfo)
                return this.getUserInfo();
            },
        },
        persist: {
            enabled: true,
            strategies: [
                {
                    key: 'user-store',
                },
            ],
        },
    });

export default useAuthStore;