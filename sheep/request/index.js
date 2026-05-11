import Request from 'luch-request';
import {apiPath, baseUrl, tenantId} from "@/sheep/config";
import $stores from '@/sheep/stores';
import router from "@/sheep/router";
import autoUser from "@/sheep/api/user/autoUser";
import {showToast} from "@/sheep/util/toast";
import user from "@/sheep/stores/user";

const options = {
    // 显示操作成功消息 默认不显示
    showSuccess: false,
    // 成功提醒 默认使用后端返回值
    successMsg: '',
    // 显示失败消息 默认显示
    showError: true,
    // 失败提醒 默认使用后端返回信息
    errorMsg: '',
    // 显示请求时loading模态框 默认显示
    showLoading: true,
    // loading提醒文字
    loadingMsg: '加载中',
    // 需要授权才能请求 默认放开
    auth: false,
    // ...
};

// 创建请求实例
const http = new Request({
    baseURL: baseUrl + apiPath,
    timeout: 8000,
    method: 'GET',
    header: {
        Accept: 'text/json',
        'Content-Type': 'application/json;charset=UTF-8',
    },
    // #ifdef APP-PLUS
    sslVerify: false,
    // #endif
    // #ifdef H5
    withCredentials: false,
    // #endif
    custom: options,
});

// 请求拦截器
http.interceptors.request.use(
    (config) => {
        const authStore = $stores('user');
        // 增加 token 令牌、terminal 终端、tenant 租户的请求头
        if (authStore.token) {
            config.header = {
                ...config.header,
                Authorization: `Bearer ${authStore.token}`, // 在头部添加 Token
            };
        }
        config.header['Accept'] = '*/*';
        config.header['login_user_type'] = '3';
        config.header['tenant-id'] = tenantId;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
http.interceptors.response.use(
    (response) => {
        // 约定：如果是 /auth/ 下的 URL 地址，并且返回了 accessToken 说明是登录相关的接口，则自动设置登陆令牌
        if (response.config.url.indexOf('/dart/oauth') >= 0 && response.data?.data?.accessToken) {
            $stores('user').setToken(response.data.data.accessToken, response.data.data.refreshToken,response.data.data.zeGoToken,response.data.data.zeGoTokenThird);
        }
		
        // 自定义处理【error 错误提示】：如果需要显示错误提示，则显示错误提示
        if (response.data.code !== 0) {
            if (response.data.code === 401) {
                return refreshToken(response.config);
            }
            // 错误提示
            if (response.config.custom.showError) {
                showToast({
                    message: response.data.msg || '服务器开小差啦,请稍后再试~',
                    icon: 'none',
                    mask: true,
                });
                return;
            }
        }

        if (
            response.config.custom.showSuccess &&
            response.config.custom.successMsg !== '' &&
            response.data.code === 0
        ) {
            showToast({
                message: response.config.custom.successMsg,
                icon: 'none',
            });
        }

        // 返回结果：包括 code + data + msg
        return Promise.resolve(response.data);
    },
    (error) => {
        showToast({
            message: '网络错误，请稍后再试',
            icon: 'none',
        });
        return Promise.reject(error);
    }
);
let requestList = []; // 请求队列
let isRefreshToken = false; // 是否正在刷新中
const refreshToken = async (config) => {
    // 如果当前已经是 refresh-token 的 URL 地址，并且还是 401 错误，说明是刷新令牌失败了，直接返回 Promise.reject(error)
    if (config.url.indexOf('/dart/oauth/refresh-token') >= 0) {
        return Promise.reject('error');
    }

    // 如果未认证，并且未进行刷新令牌，说明可能是访问令牌过期了
    if (!isRefreshToken) {
        isRefreshToken = true;
        // 1. 如果获取不到刷新令牌，则只能执行登出操作
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            return handleAuthorized();
        }
        // 2. 进行刷新访问令牌
        try {
            const refreshTokenResult = await autoUser.Api.refreshToken(refreshToken);
            if (refreshTokenResult.code !== 0) {
                // 如果刷新不成功，直接抛出 e 触发 2.2 的逻辑
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('刷新令牌失败');
            }
            // 2.1 刷新成功，则回放队列的请求 + 当前请求
            user().setToken(refreshTokenResult.data.accessToken, refreshTokenResult.data.refreshToken);
            config.header.Authorization = 'Bearer ' + getAccessToken();
            requestList.forEach((cb) => {
                cb();
            });
            requestList = [];
            return request(config);
        } catch (e) {
            // 为什么需要 catch 异常呢？刷新失败时，请求因为 Promise.reject 触发异常。
            // 2.2 刷新失败，只回放队列的请求
            requestList.forEach((cb) => {
                cb();
            });
            // 提示是否要登出。即不回放当前请求！不然会形成递归
            return handleAuthorized();
        } finally {
            requestList = [];
            isRefreshToken = false;
        }
    } else {
        // 添加到队列，等待刷新获取到新的令牌
        return new Promise((resolve) => {
            requestList.push(() => {
                config.header.Authorization = 'Bearer ' + getAccessToken(); // 让每个请求携带自定义token 请根据实际情况自行修改
                resolve(request(config));
            });
        });
    }
};

/** 获得刷新令牌 */
export const getRefreshToken = () => {
    return uni.getStorageSync('refresh-token');
};


/** 获得访问令牌 */
export const getAccessToken = () => {
    return uni.getStorageSync('token');
};

/**
 * 处理 401 未登录的错误
 */
const handleAuthorized = () => {
    const userStore = $stores('user');
    userStore.logout(true);
    // 登录超时
    return Promise.reject({
        code: 401,
        msg: userStore.isLogin ? '您的登陆已过期' : '请先登录',
    });
};


const request = async (config) => {
    const response = await http.request(config);
    // 确保返回完整的响应数据结构
    return response;
};

export default request;
