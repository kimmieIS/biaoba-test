export function validateEmail(email) {
	if(email==="admin"){
		console.log("登陆账号为管理员不进行判断通过")
		return true;
	}
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
}