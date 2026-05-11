import {reactive} from 'vue';
import sheep from "@/sheep";
import {getGameConfig, scoreConfig} from "@/sheep/config/bluetoothConfig";
import games from "@/sheep/api/dart/games";
import cacheUtil from "@/sheep/request/util";
import {showToast} from "@/sheep/util/toast";
import bluetooth from "@/sheep/stores/bluetooth";
import gameConfig from '@/sheep/config/gameConfig.json';
import {useAudioPlayer} from "@/sheep/util/useAudioPlayer";
// 游戏通用状态
const gameCommonState = reactive({
    transitionState: {
        show: false,
        text: ''
    },
    transitionStateText: {
        show: false,
        text: ''
    }
});

export function useGameCommon() {

    // 游戏开始动画
    const handleGameStart = (gameName, round, userName,gameResult = null) => {
        bluetooth().isGameStart = true;
        // showPlayerTransition(`${gameName}游戏开始`);
        // showPlayerTransition(`第${round}回合`);

        showPlayerTransitionText(`ROUND${round}`)
        if(gameResult && gameResult.value){
            gameResult.value.playVideo("/static/gif/ROUND1-3S-(1)3.gif", true, () => {});
        }
        if (gameResult && !gameResult.value) {
            gameResult.playVideo("/static/gif/ROUND1-3S-(1)3.gif", true, () => {});
        }
        useAudioPlayer().playAudio('/static/mp3/round1.mp3')
        // 睡眠一秒
        // 显示过渡动画
        // setTimeout(() => {
        //     showPlayerTransition(`${userName}的回合`);
        // }, 2000)
    };

    // 下一回合动画
    const handleNextRound = (round, roundType) => {
        console.log('下一回合动画：'+roundType)
        // 显示过渡动画
        // showPlayerTransition(`第${round}回合`);
        if(roundType === "Final Round"){
            showPlayerTransitionText(`Final Round`)
        }else{
            showPlayerTransitionText(`ROUND${round}`)
        }
        // 睡眠一秒
        // setTimeout(() => {
        //     // 显示过渡动画
        //     showPlayerTransition(`${userName}的回合`);
        // }, 2000)
    };

    // 从配置里获取对应分数
    const getScore = (gameName) => {
        const score = getGameConfig[gameName];
        return score ? score : {};
    };

    // 显示玩家切换动画
    const showPlayerTransition = (text) => {
        gameCommonState.transitionState.text = text;
        gameCommonState.transitionState.show = true;
    };

    // 显示玩家切换ROUND文字
    const showPlayerTransitionText = (text) => {
        gameCommonState.transitionStateText.text = text;
        gameCommonState.transitionStateText.show = true;
    };


    // 混合模式结束当局并跳转到下一局 游戏处理
    const mixedModeGameEnd = (state) => {
        const player = null
        if(!state.params.tameWin && state.params.modeEntity.tameWin ){
            state.params.tameWin = state.params.modeEntity.tameWin;
        }else{
            state.params.tameWin = {
                teamIdWin:[], //胜利者id
                teamIdfail:[], //失败者id
            }
        }

        //混合模式只有 1v1 和 2v2 只有两个队伍
        if(state.modeEntity.type === 1){
            // 01模式获取胜利者  (组件内方法已经排序好（第一个【0】为胜利者）)
            // tameWin.teamIdWin = state.teamArray[0].players[0].id
            // tameWin.teamIdfail = state.teamArray[1].players[0].id
            //储存当局胜利者和失败者
            state.params.tameWin.teamIdWin.push(state.teamArray[0].team)
            state.params.tameWin.teamIdfail.push(state.teamArray[1].team)
        }
        const gameConfigElement = gameConfig[8];
        let url = gameConfigElement.url;
        sheep.$router.go(url, state.params, 'reLaunch');
    };

    // 游戏结束处理
    const handleGameEnd = (reason, name = null, gameResult,showFinish) => {
        if (showFinish===undefined || showFinish===null){
            showFinish = true;
        }
        console.log("游戏结束："+showFinish)
        bluetooth().isGameStart = false;
        let message = '';
        if (reason === 'rounds') {
            message = '游戏结束：达到最大回合数';
        } else if (reason === 'score') {
            message = `游戏结束：队伍 ${name} 胜利！`;
        } else if (reason === 'blockade') {
            message = '游戏结束：所有分区都已作废';
        } else if(reason === "opponentEndGame"){
            message = '游戏结束：对手退出了游戏';
        }else if(reason === "endGame"){
            message = '游戏结束';
        }
        if(gameResult && gameResult.value && showFinish){
            console.log("播放：/static/gif/finish01.24s.gif");
            gameResult.value.playVideo("/static/gif/finish01.24s.gif", true, () => {});
        }
        if (gameResult && !gameResult.value && showFinish) {
            console.log("播放：/static/gif/finish01.24s.gif");
            gameResult.playVideo("/static/gif/finish01.24s.gif", true, () => {});
        }
        if (showFinish){
            useAudioPlayer().playAudio('/static/mp3/finish.mp3')
        }



        // setTimeout(() => {
        // 	showPlayerTransition(message);
        // }, 2000);
        //播放游戏结束动画

        // 睡眠一秒
        // 睡眠三秒
        setTimeout(() => {
            if(gameResult && gameResult.value){
                gameResult.value.gameEndPostStatistics(); //结算统计

                gameResult.value.show();
            }
            if (gameResult && !gameResult.value) {
                gameResult.gameEndPostStatistics(); //结算统计
                gameResult.show();
            }
        }, 3000);
        // uni.showModal({
        //     title: '游戏结束',
        //     content: message,
        //     showCancel: false,
        //     success: () => {
        //         // 可以通过回调处理额外逻辑
        //         sheep.$router.back();
        //     }
        // });
    };

    // 重新开始游戏
    const restartGame = (onConfirm) => {
        bluetooth().isGameStart = true;
        onConfirm();
    };

    // 游戏结束
    const endGame = (url) => {
        bluetooth().isGameStart = false;

        if (url) {
            sheep.$router.redirect(url)
        } else {
            sheep.$router.back();
        }
    };

    // 显示游戏规则
    const showGameRules = async (id) => {
        const locale = uni.getStorageSync("locale");
        const data = await cacheUtil.fetchWithCache(id + '_game_project', games.Api.getGameById, id, 1800);
        showToast({
            title: '游戏说明',
            message: locale === 'zh' ? data.chineseDescription : data.englishDescription,
            isSticky: true
        });
    };
    /**
     * 01加分的重投方法
     * @param {Object} gameState 当前游戏状态
     * @param {Array} teamArray 队伍数组
     */
    const rethrowCurrentRound = (gameState, teamArray) => {
        // 检查回合状态
        if (gameState.currentDart === 0) {
            showToast({
                message: '当前回合还未开始',
                icon: 'none',
            });
            return;
        }

        const activeTeam = teamArray.find(t => t.team === gameState.currentTeam);
        if (!activeTeam) return;

        // 减少团队轮数（如果是最后一镖）
        if (gameState.currentDart === 3) {
            activeTeam.teamRoundNbr--;
        }

        const activePlayer = activeTeam.players[gameState.currentPlayerIndex];
        if (!activePlayer) return;

        // 获取当前回合的得分记录
        const currentRoundScores =
            gameState.roundScores[gameState.currentRound]?.[activeTeam.team]?.[activePlayer.id] || [];

        // 计算需要恢复的分数
        const scoreToRestore = currentRoundScores.reduce((sum, item) => sum + item.score, 0);

        // 恢复团队分数
        activeTeam.currentScore += scoreToRestore;

        // 恢复个人分数
        if (activePlayer.currentScore) {
            activePlayer.currentScore += scoreToRestore;
        }

        // 清空当前回合的投掷记录
        if (gameState.roundScores[gameState.currentRound]?.[activeTeam.team]) {
            gameState.roundScores[gameState.currentRound][activeTeam.team][activePlayer.id] = [];
        }

        // 重置当前镖数
        gameState.currentDart = 0;

        // 更新玩家的得分历史记录
        if (activePlayer.scoreHistory) {
            const currentRoundIndex = activePlayer.scoreHistory.recentRounds.findIndex(
                round => round.roundNumber === gameState.currentRound
            );
            if (currentRoundIndex !== -1) {
                activePlayer.scoreHistory.recentRounds.splice(currentRoundIndex, 1);
            }
        }

        // 显示提示
        // showToast({
        //     message: '重投成功',
        //     icon: 'none',
        // });
    };

    /**
     * 常规游戏的重投方法
     */
    const routineRethrowCurrentRound = (state, startOnConfirm, endOnConfirm) => {
        if (startOnConfirm) {
            const startOnConfirm1 = startOnConfirm();
            if (startOnConfirm1 === 'end') {
                return;
            }
        }

        const activeTeam = state.teamArray.find(t => t.team === state.gameState.currentTeam);
        const activePlayer = activeTeam?.players[state.gameState.currentPlayerIndex];

        if (!activePlayer) return;

        // 获取当前回合的得分记录
        const currentRoundScores = state.gameState.roundScores[state.gameState.currentRound]?.[activeTeam.team]?.[activePlayer.id] || [];

        // 减少团队轮数（如果是最后一镖）
        if (state.gameState.currentDart === 3) {
            activeTeam.teamRoundNbr--;
        }

        // 减去当前回合的分数
        const scoreToDeduct = currentRoundScores.reduce((sum, score) => sum + score.score, 0);
        activeTeam.currentScore -= scoreToDeduct;

        // 清空当前回合的投掷记录
        state.gameState.roundScores[state.gameState.currentRound][activeTeam.team][activePlayer.id] = [];

        // 重置当前镖数
        state.gameState.currentDart = 0;

        if (endOnConfirm) {
            endOnConfirm();
        }
    }
    /**
     * 米老鼠游戏减分的重投方法
     */
    const deductionRethrowCurrentRound = (state) => {
        const activeTeam = state.teamArray.find(t => t.team === state.gameState.currentTeam);
        const activePlayer = activeTeam?.players[state.gameState.currentPlayerIndex];

        if (!activePlayer) return;

        // 获取当前回合的得分记录
        const currentRoundScores = state.gameState.roundScores[state.gameState.currentRound]?.[activeTeam.team]?.[activePlayer.id] || [];

        // 遍历当前回合的每个得分记录，撤销其效果
        currentRoundScores.forEach(throwRecord => {
            const scoringArea = throwRecord.area === 'B' ? '21' : throwRecord.area;
            const areaLock = state.teamLocks[activeTeam.team][scoringArea];

            if (areaLock) {
                // 记录原始状态
                const originalCount = areaLock.count;
                const wasLocked = areaLock.locked;

                // 如果是倍数区，需要减去相应的次数
                const multiplier = throwRecord.multiplier || 1;
                areaLock.count = Math.max(0, areaLock.count - multiplier);

                // 如果撤销后命中次数小于3，重置锁定状态
                if (areaLock.count < 3 && !wasLocked) {
                    areaLock.locked = true;
                    // 从作废区域列表中移除（如果存在）
                    const forbiddenIndex = state.gameState.forbiddenAreas.indexOf(parseInt(scoringArea));
                    if (forbiddenIndex !== -1) {
                        state.gameState.forbiddenAreas.splice(forbiddenIndex, 1);
                    }
                }
            }
        });

        // 重置得分记录
        state.gameState.roundScores[state.gameState.currentRound][activeTeam.team][activePlayer.id] = [];

        // 清除历史记录中的当前回合记录
        if (activePlayer.scoreHistory) {
            activePlayer.scoreHistory.recentRounds = activePlayer.scoreHistory.recentRounds.filter(
                record => record.roundNumber !== state.gameState.currentRound
            );
        }

        // 重置当前镖数
        state.gameState.currentDart = 0;

        // 重新计算总分
        activeTeam.currentScore = 0;
        Object.values(state.gameState.roundScores).forEach(roundData => {
            if (roundData[activeTeam.team]?.[activePlayer.id]) {
                roundData[activeTeam.team][activePlayer.id].forEach(score => {
                    if (!state.teamLocks[activeTeam.team][score.area === 'B' ? '21' : score.area].locked) {
                        activeTeam.currentScore += score.area === 'B' ? 25 : parseInt(score.area);
                    }
                });
            }
        });
    };
    /**
     * 用于处理空靶问题
     * @param state
     * @param currentRound
     * @param activeTeam
     * @param activePlayer
     */
    const initializeRoundScore = (state, currentRound, activeTeam, activePlayer) => {
        // 确保当前轮次的 roundScores 存在
        if (!state.gameState.roundScores[currentRound]) {
            state.gameState.roundScores[currentRound] = {};
        }

        // 确保当前团队的 roundScores 存在
        if (!state.gameState.roundScores[currentRound][activeTeam.team]) {
            state.gameState.roundScores[currentRound][activeTeam.team] = {};
        }

        // 确保当前玩家的 roundScores 存在
        if (!state.gameState.roundScores[currentRound][activeTeam.team][activePlayer.id]) {
            state.gameState.roundScores[currentRound][activeTeam.team][activePlayer.id] = [];
        }

        const roundScoreElement = state.gameState.roundScores[currentRound][activeTeam.team][activePlayer.id];
        // 将分数数组填充到长度 3
        while (roundScoreElement.length < 3) {
            roundScoreElement.push({
                multiplier: 0,
                originalScore: 0,
                score: 0
            });
        }
    };

    /**
     * 换手处理
     * @param state
     * @param gameResult
     * @param onConfirm
     * @param startOnConfirm
     */
    const moveToNextPlayer = (state, gameResult, onConfirm, startOnConfirm) => {
        // 获取当前活动团队
        const activeTeam = state.teamArray.find(t => t.team === state.gameState.currentTeam);
        if (!activeTeam) return;

        // 获取当前玩家
        const activePlayer = activeTeam.players[state.gameState.currentPlayerIndex];
        if (!activePlayer) return;

        if (startOnConfirm) {
            startOnConfirm(activeTeam, activePlayer);
        }

        // 如果投掷数量不等于 3，团队轮数 +1
        if (state.gameState.currentDart !== 3) {
            activeTeam.teamRoundNbr++;

            // 初始化当前玩家的 roundScore
            initializeRoundScore(state, state.gameState.currentRound, activeTeam, activePlayer);
        }

        // 取消当前玩家的活动状态
        activePlayer.isActive = false;

        // 重置镖数
        state.gameState.currentDart = 0;


        // 计算当前回合中每个团队已完成的投掷轮数
        const currentRoundThrows = state.teamArray.reduce((acc, team) => {
            const teamScores = state.gameState.roundScores[state.gameState.currentRound]?.[team.team] || {};
            acc[team.team] = Object.values(teamScores).filter(scores => Array.isArray(scores) && scores.length === 3).length;
            return acc;
        }, {});

        // 检查是否所有团队都完成了当前回合
        const allTeamsCompleted = state.teamArray.every(team => team.teamRoundNbr >= state.gameState.teamSize);

        let nextTeam, nextPlayerIndex;
        let currentRound = state.gameState.currentRound;
        if (allTeamsCompleted) {
            // 进入下一回合
            currentRound++
            state.gameState.roundScores[state.gameState.currentRound] = {};

            // 从第一个团队开始新回合
            nextTeam = state.teamArray[0];
            nextPlayerIndex = 0;

            // 重置所有团队的投掷轮数
            state.teamArray.forEach(item => item.teamRoundNbr = 0);

        } else {
            // 移动到下一个团队
            const currentTeamIndex = state.teamArray.findIndex(t => t.team === state.gameState.currentTeam);
            const nextTeamIndex = (currentTeamIndex + 1) % state.teamArray.length;
            nextTeam = state.teamArray[nextTeamIndex];

            // 计算下一个玩家的索引
            const teamThrowCount = currentRoundThrows[nextTeam.team] || 0;
            nextPlayerIndex = teamThrowCount % nextTeam.players.length;

            if (nextTeam.players[nextPlayerIndex]) {
                //显示换手动画
                useAudioPlayer().playAudio('/static/mp3/nextPalyer.mp3')
                if(gameResult && gameResult.value){
                    gameResult.value.playVideo("/static/gif/NEXT-PALYER-2S.gif", true, () => {});
                }
                if (gameResult && !gameResult.value) {
                    gameResult.playVideo("/static/gif/NEXT-PALYER-2S.gif", true, () => {});
                }


                // 睡眠一秒
                // setTimeout(() => {
                //    // 显示过场动画
                //    showPlayerTransition(`${nextTeam.players[nextPlayerIndex].playerName} 回合`);
                // }, 2000)
                // // 显示过场动画
                // showPlayerTransition(`${nextTeam.players[nextPlayerIndex].playerName} 回合`);
            }
        }


        // state.averageScores =   state.gameState.averageScores[nextTeam.players[0].id].average  //下一个玩家PPR

        //下一个玩家PPR
        state.averageScores =  state.gameState.averageScores[nextTeam.players[0].id].scoreAverage != 0? (state.gameState.averageScores[nextTeam.players[0].id].scoreAverage
            / state.gameState.averageScores[nextTeam.players[0].id].currentRound).toFixed(2) : 0

        // state.averageScores =   state.gameState.averageScores[nextTeam.players[0].id].average  //下一个玩家平均分
        // 设置下一个投掷者
        state.gameState.currentTeam = nextTeam.team;
        state.gameState.currentPlayerIndex = nextPlayerIndex;
        nextTeam.players[nextPlayerIndex].isActive = true;
        //检查是否AI模式  并且是AI投标 //队伍2是ai
        if(state.params?.type === 10 && nextTeam.team === 2){
            //调用自动投标
            if(gameResult && gameResult.value){
                gameResult.value.automaticBid();
            }
            if (gameResult && !gameResult.value) {
                gameResult.automaticBid();
            }
        }

        // 检查游戏是否结束
        if (state.gameState.maxRounds !== -1 && currentRound > state.gameState.maxRounds) {
            //判断是否混合模式
            if(state.modeEntity?.type === 8){
                mixedModeGameEnd(state)
                return;
            }
            handleGameEnd('rounds', null, gameResult);
            return;
        }
        if(allTeamsCompleted){
            state.gameState.currentRound++;
            state.gameState.roundScores[state.gameState.currentRound] = {};
        }

        if (allTeamsCompleted && nextTeam.players[nextPlayerIndex]) {
            if (onConfirm) {
                onConfirm();
            } else {
                if(gameResult && gameResult.value){
                    gameResult.value.playVideo("/static/gif/ROUND1-3S-(1)3.gif", true, () => {});
                }
                if (gameResult && !gameResult.value) {
                    gameResult.playVideo("/static/gif/ROUND1-3S-(1)3.gif", true, () => {});
                }

                useAudioPlayer().playAudio('/static/mp3/round1.mp3')
                // 显示过场动画
                let round = "";
                if(currentRound === state.gameState.maxRounds){
                    round = "Final Round"
                }
                handleNextRound(state.gameState.currentRound, round);
                // setTimeout(() => {

                // }, 2500)

            }
        }
    };

    return {
        gameCommonState,
        initializeRoundScore,
        handleNextRound,
        getScore,
        handleGameStart,
        showPlayerTransition,
        handleGameEnd,
        restartGame,
        endGame,
        showGameRules,
        rethrowCurrentRound,
        moveToNextPlayer,
        deductionRethrowCurrentRound,
        routineRethrowCurrentRound,
        mixedModeGameEnd
    };
} 