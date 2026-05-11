import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';

export const PlayerApi = `${MODULES.DART}${ENDPOINTS.AIGAMES}`;

export default {
    PlayerApi : `${MODULES.DART}${ENDPOINTS.AIGAMES}`,
    // ai命中率相关接口
    Api: {
        // 获取ai命中率列表信息
        getList: () =>
            request({
                url: `${PlayerApi}/list`,
                method: 'GET',
            }),

    },
};
