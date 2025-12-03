// pages/sign/sign.js
const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		email: '',
		code: '',
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		new app.ToastPannel();
		this.url = getApp().globalData.$url;
	},
	register() {
		if (this.data.email == "")
			return this.show("请输入邮箱")
		wx.showLoading({
			title: '获取中..',
		})
		let token = wx.getStorageSync('token')
		wx.request({
			url: this.data.url + '/users/email',
			method: 'post',
			header: {
				'Authorization': token
			},
			data: {
				email: this.data.email
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.showToast({
						title: '验证码已发送',
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
	into() {
		if (this.data.email == "")
			return this.show("请输入邮箱")
		if (this.data.code == "")
			return this.show("请输入验证码")
		wx.showLoading({
			title: '修改中..',
		})
		let token = wx.getStorageSync('token')
		wx.request({
			url: this.data.url + '/users/email/verify',
			method: 'post',
			header: {
				'Authorization': token
			},
			data: {
				email: this.data.email,
				code: this.data.code
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.showToast({
						title: '修改成功',
						icon: 'success',
						duration: 1500,
						mask: true,
						success: () => {
							setTimeout(() => {
								wx.reLaunch({
									url: '/pages/index/index'
								})
							}, 1500)
						}
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
