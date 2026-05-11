import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';

const PlayerApi = `${MODULES.DART}${ENDPOINTS.GAMES}`;

export default {
    // 玩家相关接口
    Api: {
        // 获取玩家信息
        getGames: (data) =>
            request({
                url: `${PlayerApi}/getGames`,
                method: 'POST',
                data: data
            }),
        getGameById(id){
            return request({
                url: `${PlayerApi}/getGamesById/${id}`,
                method: 'POST',
            })
        }
    },
};
