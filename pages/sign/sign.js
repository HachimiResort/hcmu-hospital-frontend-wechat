// pages/sign/sign.js
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
		this.url = getApp().globalData.$url;
	},
	change() {
		let is = !this.data.issign
		this.setData({
			issign: is
		})
	},
	into() {
		if (this.data.userName == "" || this.data.password == '') return wx.showToast({
			title: '请输入完整',
			icon:'none'
		})
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
					wx.showToast({
						title: res.data.msg,
						icon:'none'
					})
				}
			},
			fail: (err) => {
				wx.hideLoading()
				wx.showToast({
					title: '请检查网络连接',
					icon:'none'
				})
			}
		})
	},
	register() {
		if (this.data.userName == "" || this.data.password == '' || this.data.checkPassword == ''
			|| this.data.name == "" || this.data.email == '') return wx.showToast({
				title: '请输入完整',
				icon:'none'
			})
		if (this.data.password != this.data.checkPassword) return wx.showToast({
			title: '两次密码不一致',
			icon:'none'
		})
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
					wx.showToast({
						title: res.data.msg,
						icon:'none'
					})
				}
			},
			fail: (err) => {
				wx.hideLoading()
				wx.showToast({
					title: '请检查网络连接',
					icon:'none'
				})
			}
		})
	},
	registerVerify() {
		if (this.data.userName == "" || this.data.password == '' || this.data.checkPassword == ''
			|| this.data.name == "" || this.data.email == '' || this.data.code == '') return wx.showToast({
				title: '请输入完整',
				icon:'none'
			})
		if (this.data.password != this.data.checkPassword) return wx.showToast({
			title: '两次密码不一致',
			icon:'none'
		})
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
					wx.showToast({
						title: res.data.msg,
						icon:'none'
					})
				}
			},
			fail: (err) => {
				wx.hideLoading()
				wx.showToast({
					title: '请检查网络连接',
					icon:'none'
				})
			}
		})
	},
	seek() {
		wx.navigateTo({
			url: './seek/seek',
		})
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