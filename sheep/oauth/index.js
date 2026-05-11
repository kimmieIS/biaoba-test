import {showToast} from "@/sheep/util/toast";
import autoUser from "@/sheep/api/user/autoUser";
import sheep from "@/sheep";
import {getMessage} from "@/sheep/common/msgCommon";
import $stores from "@/sheep/stores";

/**
 * 通用 OAuth 登录方法
 * @param {string} provider - 登录平台（如 "weixin", "apple", "google"）
 */
export const OAuthLogin = (provider) => {
    console.log("开始登录",provider);

    uni.login({
        provider,
        success: async (loginRes) => {
			console.log("登录授权成功",loginRes)
            if (loginRes.errMsg !== "login:ok") {
                showToast({message: `登录授权失败：${loginRes.errMsg || loginRes.code}`, icon: "none"});
                return;
            }

            await handleLoginSuccess(provider, loginRes);
        },
        fail: (err) => {
			console.log("登录授权失败",err)
            showToast({message: `登录授权失败：${err.code}`, icon: "none"});
        },
    });

};

/**
 * 登录成功后的处理逻辑
 * @param {string} provider - 登录平台
 * @param {object} loginRes - 登录结果
 */
const handleLoginSuccess = (provider, loginRes) => {
    console.log("登录成功，开始获取用户信息");

    uni.getUserInfo({
        provider: provider,
        success: async (info) => {
            console.log("用户信息：", info);

            try {
                const userInfo = await getOAuthUserInfo(provider, loginRes, info);
                const data = {platform: provider, userInfo};

                console.log("登录数据：", JSON.stringify(data));

                const res = await autoUser.Api.oauth(data);
                if (res) {
                    showToast({message: "登录成功", icon: "success"});
                    setTimeout(() => sheep.$router.go("/pages/game/home/index"), 1500);
                }
            } catch (err) {
                console.error("获取用户信息失败：", err);
                showToast({message: `获取用户信息失败：${err.message || err.code}`, icon: "none"});
            }
        },
        fail: (err) => {
            console.log("用户信息获取失败：", err);
            showToast({message: `用户信息获取失败：${err.code}`, icon: "none"});
        }
    });
};

/**
 * 绑定openid
 * @param {string} provider - 登录平台（如 "weixin", "apple", "google"）
 */
export const bindOpenId = (provider, userId) => {
    uni.login({
        provider,
        success: async (loginRes) => {
            if (loginRes.errMsg !== "login:ok") {
                showToast({message: `授权失败：${loginRes.errMsg || loginRes.code}`, icon: "none"});
                return;
            }
            uni.getUserInfo({
                provider: provider,
                success: async (info) => {
                    try {
                        const userInfo = await getOAuthUserInfo(provider, loginRes, info);
                        const data = {platform: provider, userInfo, userId};
                        console.log("授权数据：", data);
                        const res = await autoUser.Api.bindAccount(data);
                        if (res) {
                            showToast({message: "绑定成功", icon: "success"});
                            $stores('user').updateUserData()
                        }
                    } catch (err) {}
                },
                fail: (err) => {
                    showToast({message: `用户信息获取失败：${err.code}`, icon: "none"});
                }
            });
        },
        fail: (err) => {
            showToast({message: `授权失败：${err.code}`, icon: "none"});
        },
    });
};

/**
 * 获取用户信息（根据平台区分）
 * @param {string} provider - 登录平台
 * @param {object} loginRes - 登录结果
 * @param {object} info - 从 uni.getUserInfo 获取的用户信息
 * @returns {Promise<object>} 用户信息
 */
const getOAuthUserInfo = async (provider, loginRes, info) => {
	console.log("info====", info);
    const platformHandlers = {
        weixin: () => weixinOAuth(loginRes, info),
        apple: () => appleOAuth(loginRes, info),
        google: () => googleOAuth(loginRes, info),
    };

    const handler = platformHandlers[provider];
    if (!handler) {
        throw new Error("不支持的登录方式");
    }

    return handler(loginRes, info);
};

/**
 * 微信登录用户信息处理
 * @param {object} loginRes - 登录结果
 * @param {object} info - 获取的用户信息
 * @returns {object} 用户信息
 */
const weixinOAuth = (loginRes, info) => {
    // 这里可以结合微信的特定返回数据进行处理
    return {...loginRes, ...info};
};

/**
 * Apple 登录用户信息处理
 * @param {object} loginRes - 登录结果
 * @param {object} info - 获取的用户信息
 * @returns {object} 用户信息
 */
const appleOAuth = (loginRes, info) => {
    // 这里可以结合 Apple 的授权信息进行处理
    return {...loginRes, ...info.userInfo};
};

/**
 * Google 登录用户信息处理
 * @param {object} loginRes - 登录结果
 * @param {object} info - 获取的用户信息
 * @returns {object} 用户信息
 */
const googleOAuth = (loginRes, info) => {
    // 这里可以结合 Google 的授权信息进行处理
    return {...loginRes, ...info};
};