import $stores from "@/sheep/stores";
import noAuthPages from "@/sheep/router/noAuthPages";

// 标记是否正在处理路由，防止循环调用
let isHandlingRoute = false;

const isLoggedIn = () => {
    return $stores('user').isLogin;
};

// 辅助函数：检查目标页面是否需要登录拦截
const isNoAuthPage = (url) => {
    const page = url.split('?')[0]; // 去掉查询参数部分
    return noAuthPages.some((authPage) => authPage.includes(page));
};


// 全局路由守卫
const routerBeforeEach = (url) => {
    // 如果已经在处理路由，直接放行
    if (isHandlingRoute) {
        return true;
    }

    // 标记开始处理路由
    isHandlingRoute = true;

    try {
        // 如果未登录，且目标页面需要拦截，则返回 false
        if (!isLoggedIn() && !isNoAuthPage(url)) {
            // 如果当前已经在首页，不需要再次跳转
            if (url === '/pages/index/index' || url === '/') {
                return true;
            }

            // 跳转到登录页
            setTimeout(() => {
                if (!isLoggedIn() && !isNoAuthPage(url)) {
                    go('/pages/index/index');
                }
            }, 2000);
            return false;
        }
        return true;
    } finally {
        // 确保处理完后重置标记
        setTimeout(() => {
            isHandlingRoute = false;
        }, 0);
    }
};

const go = (url, params = {}, type = 'navigateTo') => {
    const formattedUrl = buildUrl(url, params);

    if (!formattedUrl) {
        console.error('Target URL is missing!');
        return;
    }

    // 检查路由守卫
    if (!routerBeforeEach(formattedUrl)) {
        return;
    }
    // 执行导航
    setTimeout(() => {
        switch (type) {
            case 'navigateTo':
                uni.navigateTo({
                    url: formattedUrl,
                    animationType: "fade-in",
                    animationDuration: 200
                });
                break;
            case 'redirectTo':
                uni.redirectTo({
                    url: formattedUrl,
                    animationType: "fade-in",
                    animationDuration: 200
                });
                break;
            case 'reLaunch':
                uni.reLaunch({
                    url: formattedUrl,
                    animationType: "fade-in",
                    animationDuration: 200
                });
                break;
            case 'switchTab':
                uni.switchTab({
                    url: formattedUrl,
                    animationType: "fade-in",
                    animationDuration: 200
                });
                break;
            default:
                console.error('Unsupported navigation type');
        }
    }, 0);
};

const back = (url) => {
    if (url) {
        uni.navigateBack(url);
        return
    }
    // #ifdef H5
    history.back();
    // #endif
    // #ifndef H5
    uni.navigateBack();
    // #endif
};

const redirect = (path, params = {}) => {
    go(path, params, 'redirectTo');
};

// 辅助函数：构造带参数的 URL
const buildUrl = (url, params) => {
    const query = Object.keys(params)
        .filter((key) => {
            const value = params[key];
            // 排除 null、undefined 和字符串 "null"
            return value !== null && value !== undefined && value !== "null";
        })
        .map((key) => {
            const value = params[key];
            // 如果是对象或数组，序列化为 JSON 字符串
            if (typeof value === 'object' && value !== null) {
                return `${key}=${encodeURIComponent(JSON.stringify(value))}`;
            }
            // 其他类型直接编码
            return `${key}=${encodeURIComponent(value)}`;
        })
        .join('&');
    return query ? `${url}?${query}` : url;
};

// 获取参数
export const getParams = (options) => {
    const params = {};
    Object.keys(options).forEach((key) => {
        try {
            // 尝试反序列化参数
            params[key] = JSON.parse(decodeURIComponent(options[key]));
        } catch (e) {
            // 如果不是 JSON 字符串，直接解
            params[key] = decodeURIComponent(options[key]);
        }
    });
    return params;
}
export default {
    go,
    back,
    redirect,
    routerBeforeEach
};
