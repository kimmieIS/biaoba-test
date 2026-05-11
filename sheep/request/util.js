const cacheUtil = {
    /**
     * 获取数据（支持缓存）
     * @param {String} pageName 页面名称
     * @param {Function} apiMethod 接口方法（返回Promise）
     * @param {Object} params 接口参数（可选）
     * @param {Number} cacheTime 缓存时间，单位为秒（可选）
     * @param {Boolean} shouldCache 是否启用缓存（可选，默认true）
     * @returns {Promise} 返回获取的数据
     */
    async fetchWithCache(pageName, apiMethod, params = {}, cacheTime = 3600, shouldCache = true) {
        // 根据页面名称和方法生成缓存键
        const cacheKey = `${pageName}_${apiMethod.name}`;

        // 如果不启用缓存，直接请求接口
        if (!shouldCache) {
            try {
                return await apiMethod(params);
            } catch (err) {
                console.error("接口请求失败", err);
                throw err; // 抛出错误
            }
        }

        // 检查缓存
        const cachedData = uni.getStorageSync(cacheKey);
        if (cachedData) {
            try {
                const parsedData = JSON.parse(cachedData);

                // 检查缓存是否过期
                if (parsedData.timestamp && Date.now() - parsedData.timestamp < cacheTime * 1000) {
                    return parsedData.data; // 缓存有效，直接返回数据
                } else {
                    console.log("缓存已过期，重新请求数据");
                }
            } catch (e) {
                console.error("缓存解析失败，重新请求数据", e);
            }
        }

        // 缓存不存在或已过期，调用接口
        try {
            const data = await apiMethod(params);

            // 缓存数据并保存时间戳
            const cacheData = {
                data: data,
                timestamp: Date.now(), // 保存数据的时间戳
            };
            if (cacheData) {
                uni.setStorageSync(cacheKey, JSON.stringify(cacheData));
            }
            return data;
        } catch (err) {
            console.error("接口请求失败", err);
            throw err; // 抛出错误
        }
    },
};

export default cacheUtil;
