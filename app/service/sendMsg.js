"use strict";

const { Service } = require("egg");
const moment = require("moment");
const { calendar } = require("../utils/calendar");

class sendMsg extends Service {
	// 发送模板消息给女朋友
	async sendOut() {
		const { ctx } = this;
		const token = await this.getToken();
		const datas = await this.getTemplateData();
		ctx.logger.info("获取token结果： %j", token);
		const users = await this.getUsers(token);
		const arr = [];
		datas.forEach((item) => {
			users.forEach((id) => {
				const newObj = Object.assign({}, item);
				newObj.touser = id;
				arr.push(newObj);
			});
		});
		const promise = arr.map((item) => {
			ctx.logger.info("------开始每日提醒------：");
			return this.toWechat(token, item);
		});
		const results = await Promise.all(promise);
		ctx.logger.info("------结束每日提醒------: %j", results);
		return results;
	}
	// 发送模板消息
	async toWechat(token, data) {
		const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`;
		const result = await this.ctx.curl(url, {
			method: "POST",
			data,
			dataType: "json",
			headers: {
				"content-type": "application/json"
			}
		});
		return result;
	}
	// 获取userID
	async getUsers(token) {
		const url = `https://api.weixin.qq.com/cgi-bin/user/get?access_token=${token}`;
		const result = await this.ctx.curl(url, {
			method: "GET",
			dataType: "json"
		});
		if (result && result.status === 200) {
			return result.data.data.openid;
		}
	}
	// 获取Access Token
	async getToken() {
		const { app } = this;
		const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${app.config.wechat.appid}&secret=${app.config.wechat.secret}`;
		const result = await this.ctx.curl(url, {
			method: "GET",
			dataType: "json"
		});
		if (result && result.status === 200) {
			return result.data.access_token;
		}
	}
	// 组装模板消息数据
	async getTemplateData() {
		const arr = [];
		const { app } = this;
		// 判断所需模板
		// 恋爱纪念日模板 getNextLoveDay === 0 loveDay
		// 生日模板 getNextBirthDay === 0 birthDay
		// 正常模板
		const loveDay = this.getNextLoveDay();
		const birthDay = this.getNextBirthDay();
		const data = {
			topColor: "#404040",
			data: {}
		};
		// 恋爱纪念日模板
		if (!loveDay) {
			data.template_id = app.config.wechat.loveDay;
			data.data = {
				dateTime: {
					value: this.getDateTime(),
					color: "#00A5FF"
				},
				love: {
					value: this.getLoveYear(),
					color: "#ED6EA3"
				}
			};
			// 生日模板
		} else if (!birthDay) {
			data.template_id = app.config.wechat.birthDay;
			data.data = {
				dateTime: {
					value: this.getDateTime(),
					color: "#00A5FF"
				},
				annum: {
					value: this.getBirthYear(),
					color: "#F568AC"
				}
			};
			// 正常模板
		} else {
			data.template_id = app.config.wechat.daily;
			// 获取每日一句
			const message = await this.getOneSentence();
			data.data = {
				dateTime: {
					value: this.getDateTime(),
					color: "#00A5FF"
				},
				love: {
					value: this.getLoveDay(),
					color: "#ED6EA3"
				},
				nextLove: {
					value: this.getNextLoveDay(),
					color: "#ED6EA3"
				},
				nextBirth: {
					value: this.getNextBirthDay(),
					color: "#F568AC"
				},
				message: {
					value: message,
					color: "#971D89"
				}
			};
		}
		arr.push(data);
		// 获取天气
		// const weather = await this.getWeatherDayTwo();
		// 封装天气
		// const dataWeather = {
		//   topColor: '#404040',
		//   data: {},
		// };
		// dataWeather.template_id = app.config.wechat.weather;
		// dataWeather.data = {
		//   wea: {
		//     value: weather.wea,
		//     color: '#1B71BE',
		//   },
		//   tem: {
		//     value: weather.tem,
		//     color: '#EF462F',
		//   },
		//   tem1: {
		//     value: weather.tem1,
		//     color: '#FF2816',
		//   },
		//   tem2: {
		//     value: weather.tem2,
		//     color: '#0692CD',
		//   },
		//   win: {
		//     value: weather.win,
		//     color: '#CCE8CF',
		//   },
		//   win_speed: {
		//     value: weather.win_speed,
		//     color: '#CCE8CF',
		//   },
		//   win_meter: {
		//     value: weather.win_meter,
		//     color: '#CCE8CF',
		//   },
		//   humidity: {
		//     value: weather.humidity,
		//     color: '#006493',
		//   },
		//   visibility: {
		//     value: weather.visibility,
		//     color: '#BFBEBA',
		//   },
		//   pressure: {
		//     value: weather.pressure,
		//     color: '#147456',
		//   },
		//   air: {
		//     value: weather.air,
		//     color: '#3969E8',
		//   },
		//   air_level: {
		//     value: weather.air_level,
		//     color: '#3969E8',
		//   },
		//   air_tips: {
		//     value: weather.air_tips,
		//     color: '#3969E8',
		//   },
		//   air_pm25: {
		//     value: weather.air_pm25,
		//     color: '#3969E8',
		//   },
		//   alarm_type: {
		//     value: weather.alarm.alarm_type,
		//     color: '#FE0000',
		//   },
		//   alarm_level: {
		//     value: weather.alarm.alarm_level,
		//     color: '#FE0000',
		//   },
		//   alarm_content: {
		//     value: weather.alarm.alarm_content,
		//     color: '#FE0000',
		//   },
		// };
		// arr.push(dataWeather);
		// 封装天气指数
		// const dataIndex = {
		//   topColor: '#404040',
		//   data: {},
		// };
		// dataIndex.template_id = app.config.wechat.indexOne;
		// dataIndex.data = {
		//   one: {
		//     value: weather.one,
		//     color: '#3969E8',
		//   },
		//   two: {
		//     value: weather.two,
		//     color: '#3969E8',
		//   },
		//   three: {
		//     value: weather.three,
		//     color: '#3969E8',
		//   },
		//   four: {
		//     value: weather.four,
		//     color: '#3969E8',
		//   },
		//   five: {
		//     value: weather.five,
		//     color: '#3969E8',
		//   },
		//   six: {
		//     value: weather.six,
		//     color: '#3969E8',
		//   },
		//   seven: {
		//     value: weather.seven,
		//     color: '#3969E8',
		//   },
		//   eight: {
		//     value: weather.eight,
		//     color: '#3969E8',
		//   },
		//   nine: {
		//     value: weather.nine,
		//     color: '#3969E8',
		//   },
		//   ten: {
		//     value: weather.ten,
		//     color: '#3969E8',
		//   },
		//   eleven: {
		//     value: weather.eleven,
		//     color: '#3969E8',
		//   },
		//   twelve: {
		//     value: weather.twelve,
		//     color: '#3969E8',
		//   },
		//   thirteen: {
		//     value: weather.thirteen,
		//     color: '#3969E8',
		//   },
		//   fourteen: {
		//     value: weather.fourteen,
		//     color: '#3969E8',
		//   },
		//   fifteen: {
		//     value: weather.fifteen,
		//     color: '#3969E8',
		//   },
		//   sixteen: {
		//     value: weather.sixteen,
		//     color: '#3969E8',
		//   },
		// };
		// arr.push(dataIndex);
		// const dataIndexTwo = Object.assign({}, dataIndex);
		// dataIndexTwo.template_id = app.config.wechat.indexTwo;
		// arr.push(dataIndexTwo);
		// const dataIndexThree = Object.assign({}, dataIndex);
		// dataIndexThree.template_id = app.config.wechat.indexThree;
		// arr.push(dataIndexThree);
		return arr;
	}
	// 获取天气
	async getWeatherDayOne(city = "临猗") {
		try {
			const { app } = this;
			const url = `https://www.tianqiapi.com/api?unescape=1&version=v6&appid=${app.config.weather.appid}&appsecret=${app.config.weather.appsecret}&city=${city}`;
			const result = await this.ctx.curl(url, {
				method: "GET",
				dataType: "json"
			});
			if (result && result.status === 200) {
				return result.data;
			}
			return {
				city,
				wea: "", // 天气情况
				tem: "", // 实时温度
				tem1: "", // 高温
				tem2: "", // 低温
				win: "", // 风向
				win_speed: "", // 风力等级
				win_meter: "", // 风速
				humidity: "", // 湿度
				visibility: "", // 能见度
				pressure: "", // 气压
				air: "", // 空气质量
				air_level: "", // 空气质量等级
				air_tips: "", // 空气质量描述
				air_pm25: "", // PM2.5
				alarm: {
					// 气象预警
					alarm_type: "", // 预警类型
					alarm_level: "", // 预警级别
					alarm_content: "" // 预警详细信息
				}
			};
		} catch (error) {
			return {
				city,
				wea: "", // 天气情况
				tem: "", // 实时温度
				tem1: "", // 高温
				tem2: "", // 低温
				win: "", // 风向
				win_speed: "", // 风力等级
				win_meter: "", // 风速
				humidity: "", // 湿度
				visibility: "", // 能见度
				pressure: "", // 气压
				air: "", // 空气质量
				air_level: "", // 空气质量等级
				air_tips: "", // 空气质量描述
				air_pm25: "", // PM2.5
				alarm: {
					// 气象预警
					alarm_type: "", // 预警类型
					alarm_level: "", // 预警级别
					alarm_content: "" // 预警详细信息
				}
			};
		}
	}
	// 获取距离下次恋爱纪念日还有多少天
	getNextLoveDay() {
		const { app } = this;
		const loveDay = app.config.time.love;
		// 获取当前时间戳
		const now = moment(moment().format("YYYY-MM-DD")).valueOf();
		// 获取纪念日 月-日
		const mmdd = moment(loveDay).format("-MM-DD");
		// 获取当年
		const yyyy = moment().year();
		// 获取今年恋爱纪念日时间戳
		const nowTimeNumber = moment(yyyy + mmdd).valueOf();
		// 判断 今年的恋爱纪念日有没有过，如果已经过去（now > nowTimeNumber)，resultLove日期为明年的恋爱纪念日
		// 如果还没有过，则结束日期为今年的恋爱纪念日
		let resultLove = nowTimeNumber;
		if (now > nowTimeNumber) {
			// 获取明年纪念日
			resultLove = moment(yyyy + 1 + mmdd).valueOf();
		}
		return moment(moment(resultLove).format()).diff(moment(now).format(), "day");
	}
	// 获取距离下次生日 还有多少天
	getNextBirthDay() {
		const { app } = this;
		const birth = app.config.time.birth;
		// 下面这几个是出生那年的农历的出生年月日
		// const birthyear = moment(birth).year();
		const birthmonth = moment(birth).month() + 1;
		const birthDay = moment(birth).date();
		const year = moment().year();
		const now = moment(moment().format("YYYY-MM-DD")).valueOf();
		const result = calendar.lunar2solar(year, birthmonth, birthDay);
		// 当年的出生年月日 阳历
		const nowTimeNumber = moment([result.cYear, result.cMonth - 1, result.cDay]).valueOf();
		let resultTime = nowTimeNumber;
		if (now > nowTimeNumber) {
			const nextYearBirth = calendar.lunar2solar(year + 1, birthmonth, birthDay);
			resultTime = moment([nextYearBirth.cYear, nextYearBirth.cMonth - 1, nextYearBirth.cDay]).valueOf();
		}
		return moment(moment(resultTime).format()).diff(moment(now).format(), "day");
	}
	// 获取相恋天数
	getLoveDay() {
		const { app } = this;
		const loveDay = app.config.time.love;
		return moment(moment().format("YYYY-MM-DD")).diff(loveDay, "day");
	}
	// 获取相恋几年了
	getLoveYear() {
		const { app } = this;
		const loveDay = app.config.time.love;
		return moment().year() - moment(loveDay).year();
	}
	// 获取是第几个生日
	getBirthYear() {
		const { app } = this;
		const birth = app.config.time.birth;
		return moment().year() - moment(birth).year();
	}
	// 获取每日一句
	async getOneSentence() {
		const url = "https://v1.hitokoto.cn/";
		const result = await this.ctx.curl(url, {
			method: "GET",
			dataType: "json"
		});
		if (result && result.status === 200) {
			return result.data.hitokoto;
		}
		return "今日只有我爱你！";
		// return '我知道你正在经历人生中的一次重要挑战，或许你有焦虑、有恐惧、也有激动，但我想说，请不要忘记身边所有关爱你的人，我们是你坚强的后盾。楠宝宝，加油！'
	}
	// 获取时间日期
	getDateTime() {
		const week = {
			1: "星期一",
			2: "星期二",
			3: "星期三",
			4: "星期四",
			5: "星期五",
			6: "星期六",
			0: "星期日"
		};
		return moment().format("YYYY年MM月DD日 ") + week[moment().weekday()];
	}

	async getWeatherDayTwo(city = "临猗") {
		const appkey = this.app.config.weather.appkey;
		let weather = {};
		const url = `https://way.jd.com/jisuapi/weather?city=${city}&appkey=${appkey}`;
		const result = await this.ctx.curl(url, {
			method: "get",
			dataType: "json"
		});
		if (result && result.status === 200 && result.data.code === "10000") {
			const data = result.data.result.result;
			weather = {
				city,
				wea: data.weather, // 天气情况
				tem: data.temp ? data.temp + "度" : "", // 实时温度
				tem1: data.temphigh ? data.temphigh + "度" : "", // 高温
				tem2: data.templow ? data.templow + "度" : "", // 低温
				win: data.winddirect, // 风向
				win_speed: data.windpower, // 风力等级
				win_meter: data.windspeed ? data.windspeed + "km/h" : "", // 风速
				humidity: data.humidity ? data.humidity + "%" : "", // 湿度
				pressure: data.pressure ? data.pressure + "hpa" : "", // 气压
				air: (data.aqi && data.aqi.aqi) || "", // 空气质量
				air_level: (data.aqi && data.aqi.quality) || "", // 空气质量等级
				air_tips: (data.aqi.aqiinfo && data.aqi.aqiinfo.affect && data.aqi.aqiinfo.measure && data.aqi.aqiinfo.affect + "，" + data.aqi.aqiinfo.measure) || "", // 空气质量描述
				air_pm25: (data.aqi && data.aqi.ipm2_5) || "" // PM2.5
			};
		}
		const key = this.app.config.weather.key;
		const location = this.app.config.weather.location;
		// 天气情况
		let weather1 = {};
		const url1 = `https://devapi.qweather.com/v7/weather/now?location=${location}&key=${key}`;
		const result1 = await this.ctx.curl(url1, {
			method: "get",
			dataType: "json"
		});
		if (result1 && result1.status === 200 && result1.data.code === "200") {
			const now = result1.data.now;
			weather1 = {
				visibility: now.vis ? now.vis + "km" : "" // 能见度
			};
		}
		// 天气指数信息
		let weather2 = {};
		const url2 = `https://devapi.qweather.com/v7/indices/1d?type=0&location=${location}&key=${key}`;
		const result2 = await this.ctx.curl(url2, {
			method: "get",
			dataType: "json"
		});
		let one = "";
		let two = "";
		let three = "";
		let four = "";
		let five = "";
		let six = "";
		let seven = "";
		let eight = "";
		let nine = "";
		let ten = "";
		let eleven = "";
		let twelve = "";
		let thirteen = "";
		let fourteen = "";
		let fifteen = "";
		let sixteen = "";
		if (result2 && result2.status === 200 && result2.data.code === "200") {
			const data = result2.data.daily;
			data.forEach((element) => {
				if (element.type === "1") {
					one = element.text;
				}
				if (element.type === "2") {
					two = element.text;
				}
				if (element.type === "3") {
					three = element.text;
				}
				if (element.type === "4") {
					four = element.text;
				}
				if (element.type === "5") {
					five = element.text;
				}
				if (element.type === "6") {
					six = element.text;
				}
				if (element.type === "7") {
					seven = element.text;
				}
				if (element.type === "8") {
					eight = element.text;
				}
				if (element.type === "9") {
					nine = element.text;
				}
				if (element.type === "10") {
					ten = element.text;
				}
				if (element.type === "11") {
					eleven = element.text;
				}
				if (element.type === "12") {
					twelve = element.text;
				}
				if (element.type === "13") {
					thirteen = element.text;
				}
				if (element.type === "14") {
					fourteen = element.text;
				}
				if (element.type === "15") {
					fifteen = element.text;
				}
				if (element.type === "16") {
					sixteen = element.text;
				}
			});
			weather2 = {
				one,
				two,
				three,
				four,
				// three,
				five,
				six,
				seven,
				eight,
				nine,
				ten,
				eleven,
				twelve,
				thirteen,
				fourteen,
				fifteen,
				sixteen
			};
		}
		// 天气灾害预警
		let weather3 = {};
		const url3 = `https://devapi.qweather.com/v7/warning/now?location=${location}&key=${key}`;
		const result3 = await this.ctx.curl(url3, {
			method: "get",
			dataType: "json"
		});
		if (result3 && result3.status === 200 && result3.data.code === "200") {
			const warning = result3.data.warning;
			weather3 = {
				alarm: {
					// 气象预警
					alarm_type: warning.typeName || "", // 预警类型
					alarm_level: warning.level || "", // 预警级别
					alarm_content: warning.text || "" // 预警详细信息
				}
			};
		}
		return Object.assign({}, weather, weather1, weather2, weather3);
	}
}
module.exports = sendMsg;
