/* eslint valid-jsdoc: "off" */

"use strict";

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = (appInfo) => {
	/**
	 * built-in config
	 * @type {Egg.EggAppConfig}
	 **/
	const config = (exports = {});

	// use for cookie sign key, should change to your own and keep security
	config.keys = appInfo.name + "_1638344419333_9353";

	// add your middleware config here
	config.middleware = [];

	// add your user config here
	const userConfig = {
		// myAppName: 'egg',
	};

	// 时间
	config.time = {
		// 出生年、月、日 农历
		birth: "1996-04-21",
		// 相爱日期
		love: "2021-05-04"
	};
	// 天气接口配置
	config.weather = {
		appid: "27413773",
		appsecret: "c2kbhjbA",
		// 和风
		key: "f95e5f6d8ddf44acb8e9c3e79c5ee14d",
		location: "101100802",
		// 京东云
		appkey: "b2e32c9a3fdc747ba4741326b482fada"
	};
	config.wechat = {
		loveDay: "eIs-ib5racnAAxrJdB0vSu-emNa_y2TA4cbz0Nlu2OY",
		birthDay: "gYf8T8J49WpBMxC3pCGUQl8GtPH3EIt6pJ3BKwrgiXw",
		daily: "YniP_ul8V_IoH4x__fLodGJMtH0jV67XTth_tlOCmio",
		weather: "TH96M-_pbVmErBzaqIQgF21RCFZJDcB2uHKciNirCKs",
		indexOne: "_LhRHkrxK-WYdDwiQzJkiSin0rQKAR80p_OjDA0Xi4w",
		indexTwo: "Hq0Ixnvv_TnJKpJi1bs8sZAL5SmLQnmlZ0IGssN12DM",
		indexThree: "O-IbOqzKAEoluVJnZvcI3vJ3f6RriVcLe0sVoaIBgCg",
		appid: "wx458b5045d0dc50a2",
		secret: "b817f43fdc38d804798772fc753bddbc"
	};

	return {
		...config,
		...userConfig
	};
};
