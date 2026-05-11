import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';

export const PlayerApi = `${MODULES.DART}${ENDPOINTS.PLAYER}`;

export default {
    PlayerApi : `${MODULES.DART}${ENDPOINTS.PLAYER}`,
    // 玩家相关接口
    Api: {
        // 获取玩家信息
        // 修改玩家信息
        updatePlayer: (data) =>
            request({
                url: `${PlayerApi}/updatePlayer`,
                method: 'POST',
                data,
            }),
        // 修改玩家头像
        updateAvatar: (formData) => {
            return request({
                url: `${PlayerApi}/updateAvatar`,
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                data: formData,
            })
        },
		// 根据关键词搜索玩家列表
		queryPlayerByNameOrId: (keyword) =>
		    request({
		        url: `${PlayerApi}/queryPlayerByNameOrId?keyword=` + keyword,
		        method: 'GET',
		    }),
		// 线上大厅获取用户列表
		queryOnLinePlayerList: () =>
		    request({
		        url: `${PlayerApi}/queryOnLinePlayerList`,
		        method: 'GET',
		    }),	
		//修改用户在线状态
		updateOnLine: (state) =>
		    request({
		        url: `${PlayerApi}/updateOnLine?state=` + state,
		        method: 'POST',
		    }),
        //修改用户游戏状态
        updateInGame: (state) =>
            request({
                url: `${PlayerApi}/updateInGame?state=` + state,
                method: 'POST',
            }),



    },
};
