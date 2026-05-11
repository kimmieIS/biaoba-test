import {getGameConfigGrouping, scoreConfig} from "@/sheep/config/bluetoothConfig";
//分区难度比例
export const lowOrhighConfig = {
	1: {  
        lowScore: 0.7, // 低分区比例
        highScore: 0.25, //高分区比例
        center: 0.05 //牛眼比例
    },
	2: {
	    lowScore: 0.5,
	    highScore: 0.4,
	    center: 0.1
	},
	3: {
	    lowScore: 0.3,
	    highScore: 0.55,
	    center: 0.15
	},
	4: {
	    lowScore: 0.1,
	    highScore: 0.7,
	    center: 0.2
	},
	
}

//倍区难度比例
export const multipleConfig = {
	1: {  
        lowScore: 0.8,  //1倍区
        highScore: 0.15, // 2倍区
        center: 0.05 //3倍区
    },
	2: {
	    lowScore: 0.6,
	    highScore: 0.3,
	    center: 0.1
	},
	3: {
	    lowScore: 0.4,
	    highScore: 0.4,
	    center: 0.2
	}
}

//牛眼比例
export const centerConfig = {
	1: {  
        lowScore: 0.7, //外牛眼
        highScore: 0.3, // 内牛眼
    },
	2: {
	    lowScore: 0.5,
	    highScore: 0.5,
	},
	3: {
	    lowScore: 0.3,
	    highScore: 0.7,
	}
}


// AI模块，根据比例随机获取命中区域
export const getHitRate = (options) => {
	
	//获取是否命中 (是否允许空镖)
	if(options.airTarget === 0){
		const hit = getDidItHit(options.hittingAccuracy)
		console.log("是否中镖-"+ hit)
		if(hit === 2){
			return 0; //返回0.不中标
		}
	}
	//中标后或不允许空镖后 下一步 获取中标的高低分区
	const lowOrhigh = getLowOrhigh(options.partitionDiff)  // 1=低分区。2=高倍区。3=牛眼
	let partition = 0; //命中的分区
	let multiple = 0; //命中的分区倍区
	//获取高低分区后获取倍数区
	if(lowOrhigh !== 3){
		//随机获取分区 
		partition = getPartition(lowOrhigh);
		multiple = getMultiple(options.multiple)
	}else{
		//倘若命中牛眼
		multiple = getCenter(options.multiple);
		return multiple;
	}
	
	//获取分区的倍数区数据
	const gameConfig = getGameConfigGrouping();
	return gameConfig[partition].find(item=>item.multiplier === multiple).key
	
};


//随机获取分区， data = 1 = 低分区（1~14），data=2 = 高分区 （15~20）
export const getPartition = (data) =>{
	if(data === 1){
		return Math.floor(Math.random() * (14 - 1 + 1)) + 1;
	}else{
		return Math.floor(Math.random() * (20 - 15 + 1) ) + 15
	}
}

//获取中镖后的并且是牛眼后的数据
export const getCenter = (data) => {
	const center = centerConfig[data]
	//计算是否空镖 1-中，2-不中
	const item = [
		{ value: 1, percent: center.lowScore }, //外牛眼
		{ value: 2, percent: center.highScore }, // 内牛眼
	]
	const value = weightedRandomPercent(item)
	if(value === 1){ //中了外牛眼
		return 51; //输出外牛眼的数据
	}else{
		return 52;
	}
}

//获取中镖后的倍数区 data = 设置的倍数区难度 
export const getMultiple = (data) => {
	const multiple = multipleConfig[data]
	//计算是否空镖 1-中，2-不中
	const item = [
		{ value: 1, percent: multiple.lowScore }, //1倍
		{ value: 2, percent: multiple.highScore }, //2倍
		{ value: 3, percent: multiple.center }, //3倍
	]
	return weightedRandomPercent(item)
}

//获取中镖的高低分区以及牛眼 data = 设置的分区难度 
export const getLowOrhigh = (data) => {
	const lowOrhigh = lowOrhighConfig[data]
	//计算是否空镖 1-中，2-不中
	const item = [
		{ value: 1, percent: lowOrhigh.lowScore }, //低分区 （1~14区）
		{ value: 2, percent: lowOrhigh.highScore }, //高分区 （15~20区）
		{ value: 3, percent: lowOrhigh.center }, //牛眼 
	]
	return weightedRandomPercent(item)
}


//获取是否中镖   data = 中标比例 1~100
export const getDidItHit = (data) => {
	//计算是否空镖 1-中，2-不中
	const item = [
		{ value: 1, percent: data/100 },
		{ value: 2, percent: 1-(data/100) },
	]
	return weightedRandomPercent(item)
}



//根据权重获取随机数[{value: 1 //值, percent: 0.55 //百分比}{value: 2 //值, percent: 0.45 //百分比}]
export const  weightedRandomPercent = (options) =>{
  const random = Math.random(); // 0 ~ 1
  let cumulative = 0;
  
  for (const opt of options) {
    cumulative += opt.percent;
    if (random < cumulative) {
      return opt.value;
    }
  }
}