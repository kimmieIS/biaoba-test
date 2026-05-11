
// Developers can get appID from admin console.
// https://console.zego.im/dashboard
// for example:
//     const appID = 123456789;

let appID = 156387176



// AppSign only meets simple authentication requirements.
// If you need to upgrade to a more secure authentication method,
// please refer to [Guide for upgrading the authentication mode from using the AppSign to Token](https://docs.zegocloud.com/faq/token_upgrade)
// Developers can get AppSign from admin [console](https://console.zego.im/dashboard)
// for example: "abcdefghijklmnopqrstuvwxyz0123456789abcdegfhijklmnopqrstuvwxyz01"
// Note: Only valid for native apps.
let appSign = "708e70caab2d4414e6a31f06059d8e6aa235afdd1bf017c0242f6927cc2fdc78"

// Developers can get token from admin console.
// https://console.zego.im/dashboard
// Note: The user ID used to generate the token needs to be the same as the userID filled in above!
// for example:
//     const token = "04AAAAAxxxxxxxxxxxxxx";
let token = ""

// Developers should customize a user ID.
// for example:
//     const userID = "zego_benjamin";
let userID = ""
// let userID = "uniapp_ios"

let streamID = ""

function getAppID() {
	return getApp().globalData.appID ?? appID;
}

function getUserID() {
	let user_id = (getApp().globalData.userID ?? userID) || 'user_id_' + Math.floor(Math.random() * 1000000).toString(16)
	return user_id;
}

function getAppSign() {
	return (getApp().globalData.appSign ?? appSign);
}

function getToken() {
	return (getApp().globalData.token ?? token);
}

function setAppID(data) {
	getApp().globalData.appID = +data || appID;
}

function setUserID(data) {
	getApp().globalData.userID = data;
}

function setToken (data) {
	getApp().globalData.token = data;
}

function setAppSign (data) {
	getApp().globalData.appSign = data;
}

function getStreamID() {
	return (getApp().globalData.streamID ?? streamID);
}

function setStreamID (data) {
	getApp().globalData.streamID = data;
}

export default {
	setAppID,
	setUserID,
	setToken,
	getToken,
	setAppSign,
	getAppSign,
	getAppID,
	getUserID,
	getStreamID,
	setStreamID
}

