import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';
import $stores from "@/sheep/stores";

const PlayerApi = `${MODULES.DART}${ENDPOINTS.OAUTH}`;

export default {
    // 用户相关接口
    Api: {
        // 邮箱注册
        register: (registerReqVO) =>
            request({
                url: `${PlayerApi}/register`,
                method: 'POST',
                data: registerReqVO,
            }),

        // 邮箱登录
        login: (loginReqVO) => {
            $stores('user').clearUserInfo();
            return request({
                url: `${PlayerApi}/login`,
                method: 'POST',
                data: loginReqVO,
            })

        },
        // 忘记密码
        forgetPassword: (forgetPasswordReqVO) =>
            request({
                url: `${PlayerApi}/forgetPassword`,
                method: 'POST',
                data: forgetPasswordReqVO,
            }),
        // 登出 logout
        logout: () =>
            request({
                url: `${PlayerApi}/logout`,
                method: 'POST',
            }),
        // 令牌续期
        refreshToken: (refreshToken) =>
            request({
                url: `${PlayerApi}/refresh-token?refreshToken=`+refreshToken,
                method: 'POST',
            }),
        // 第三方登录
        oauth: (oauthReqVO) =>
            request({
                url: `${PlayerApi}/oauthLogin`,
                method: 'POST',
                data: oauthReqVO,
            }),
		// 绑定邮箱
		bindEmail: (bindEmailReqVO) =>
		    request({
		        url: `${PlayerApi}/bindEmail`,
		        method: 'POST',
		        data: bindEmailReqVO,
		    }),
		// 绑定账号
		bindAccount: (bindAccountReqVO) =>
		    request({
		        url: `${PlayerApi}/bindAccount`,
		        method: 'POST',
		        data: bindAccountReqVO,
				custom:{
					showError: true
				}
		    }),
    },
};
