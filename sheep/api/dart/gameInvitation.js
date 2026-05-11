import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';

export const PlayerApi = `${MODULES.DART}${ENDPOINTS.GAMEINVITATION}`;

export default {
    PlayerApi : `${MODULES.DART}${ENDPOINTS.GAMEINVITATION}`,
    // 玩家相关接口
    Api: {
        // 保存游戏邀请记录
        postCreate: (formData) =>
            request({
                url: `${PlayerApi}/create`,
                method: 'POST',
				headers: {
				    'Content-Type': 'multipart/form-data'
				},
				data: formData,
            }),
        // 更新游戏邀请记录
        update: (data) =>
            request({
                url: `${PlayerApi}/update`,
                method: 'POST',
				headers: {
				    'Content-Type': 'multipart/form-data'
				},
				data: data
            }),
		// 获得游戏邀请记录
		get: (id) =>
		    request({
		        url: `${PlayerApi}/get?id=` + id,
		        method: 'GET'
		    }),
		getList: () =>
		    request({
		        url: `${PlayerApi}/list`,
		        method: 'GET'
		    }),	
			
		
		
    },
};
