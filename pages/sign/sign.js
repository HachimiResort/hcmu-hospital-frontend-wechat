// pages/sign/sign.js
const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		issign: true,
		userName: '',
		password: '',
		checkPassword: '',
		name: '',
		phone: '',
		email: '',
		code: "",
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		new app.ToastPannel();
		this.url = getApp().globalData.$url;
	},
	change() {
		let is = !this.data.issign
		this.setData({
			issign: is
		})
	},
	into() {
		
		if (this.data.userName == "" || this.data.password == '')
			return this.show("请输入完整")
		wx.showLoading({
			title: '身份验证中..',
		})
		wx.request({
			url: this.data.url + '/auth/login',
			method: 'post',
			data: {
				userName: this.data.userName,
				password: this.data.password
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.showToast({
						title: '登录成功',
					})
					wx.setStorageSync('token', res.data.data.token);
					console.log(wx.getStorageSync('token'));
					wx.setStorageSync('userId', res.data.data.userId);
					wx.navigateBack()
				} else {
					this.show(res.data.msg)
				}
			},
			fail: (err) => {
				wx.hideLoading()
				this.show('请检查网络连接')
			}
		})
	},
	register() {
		if (this.data.userName == "" || this.data.password == '' || this.data.checkPassword == ''
			|| this.data.name == "" || this.data.email == '')
			return this.show("请输入完整")
		if (this.data.password != this.data.checkPassword)
			return this.show("两次密码不一致")
		wx.showLoading({
			title: '获取验证码中...',
		})
		let data = {
			email: this.data.email,
			userName: this.data.userName,
			password: this.data.password,
			checkPassword: this.data.checkPassword,
			name: this.data.name,
			phone: this.data.phone,
			code: this.data.code
		}
		wx.request({
			url: this.url + '/auth/register',
			method: 'post',
			data: data,
			success: (res) => {
				console.log(res)
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.showToast({
						title: '验证码发送成功!',
					})
				} else {
					this.show(res.data.msg)
				}
			},
			fail: (err) => {
				wx.hideLoading()
				this.show("请检查网络连接")
			}
		})
	},
	registerVerify() {
		if (this.data.userName == "" || this.data.password == '' || this.data.checkPassword == ''
			|| this.data.name == "" || this.data.email == '' || this.data.code == '') 
			return this.show("请输入完整")
		if (this.data.password != this.data.checkPassword) 
			return this.show("两次密码不一致")
		wx.showLoading({
			title: '注册中...',
		})
		let data = {
			email: this.data.email,
			code: this.data.code
		}
		wx.request({
			url: this.url + '/auth/register/verify',
			method: 'post',
			data: data,
			success: (res) => {
				console.log(res)
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.showToast({
						title: '注册成功!',
					})
					this.setData({
						issign: true
					})
				} else {
					this.show(res.data.msg)
				}
			},
			fail: (err) => {
				wx.hideLoading()
				this.show("请检查网络连接")
			}
		})
	},
	seek() {
		this.show("111")
	},
	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide() {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh() {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom() {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage() {

	}
})