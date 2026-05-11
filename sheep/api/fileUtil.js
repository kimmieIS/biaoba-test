import {MODULES} from '@/sheep/api/enum/Common';
import $stores from "@/sheep/stores";
import {tenantId} from "@/sheep/config";

// 基础上传下载路径
const FILE_API = `${MODULES.DART}/file`;

// 获取完整的API URL
const getFullUrl = (url) => {
    return `${process.env.SHOPRO_DEV_BASE_URL}${process.env.SHOPRO_API_PATH}${url}`;
};

// 获取通用请求头
const getCommonHeaders = () => {
    const authStore = $stores('user');
    const headers = {
        'Accept': '*/*',
        'login_user_type': '3',
        'tenant-id': tenantId
    };

    if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
    }

    return headers;
};

export default {
    // 上传文件
    upload: (url, options) => {
        return new Promise((resolve, reject) => {
            uni.uploadFile({
                url: getFullUrl(url),
                filePath: options.filePath,
                name: options.name || 'file',
                formData: options.formData || {},
                header: {
                    ...getCommonHeaders(),
                    ...(options.header || {})
                },
                success: (uploadRes) => {
                    try {
                        const result = JSON.parse(uploadRes.data);
                        resolve(result);
                    } catch (error) {
                        reject(new Error('上传响应解析失败'));
                    }
                },
                fail: (error) => {
                    reject(error);
                }
            });
        });
    },

    // 下载文件
    download: (options) => {
        return new Promise((resolve, reject) => {
            uni.downloadFile({
                url: options.url,
                header: {
                    ...getCommonHeaders(),
                    ...(options.header || {})
                },
                success: (downloadRes) => {
                    if (downloadRes.statusCode === 200) {
                        resolve(downloadRes.tempFilePath);
                    } else {
                        reject(new Error('下载失败'));
                    }
                },
                fail: (error) => {
                    reject(error);
                }
            });
        });
    },

    // 预览文件
    preview: (url) => {
        uni.downloadFile({
            url: url,
            success: function (res) {
                if (res.statusCode === 200) {
                    uni.openDocument({
                        filePath: res.tempFilePath,
                        success: function () {
                            console.log('打开文档成功');
                        },
                        fail: function() {
                            uni.showToast({
                                title: '预览失败',
                                icon: 'none'
                            });
                        }
                    });
                }
            },
            fail: function() {
                uni.showToast({
                    title: '文��下载失败',
                    icon: 'none'
                });
            }
        });
    },

    // 选择文件并上传
    chooseAndUpload: (options = {}) => {
        const {
            count = 1,
            type = 'image',
            sourceType = ['album', 'camera'],
            name = 'file',
            url,
            formData = {}
        } = options;

        return new Promise((resolve, reject) => {
            // 选择文件方法
            const chooseMethod = type === 'image' ? uni.chooseImage : uni.chooseVideo;

            chooseMethod({
                count,
                sourceType,
                success: async (res) => {
                    try {
                        const uploadResult = await fileUtil.upload(url, {
                            filePath: res.tempFilePaths[0],
                            name,
                            formData
                        });
                        resolve(uploadResult);
                    } catch (error) {
                        reject(error);
                    }
                },
                fail: (error) => {
                    reject(error);
                }
            });
        });
    }
}; 