// pages/sign/sign.js
const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		oldPassword: '',
		newPassword: '',
		checkPassword: '',
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		new app.ToastPannel();
		this.url = getApp().globalData.$url;
	},
	into() {
		if (this.data.oldPassword == '' || this.data.newPassword == '' || this.data.checkPassword == '')
			return this.show("请输入完整")
		if (this.data.newPassword != this.data.checkPassword)
			return this.show("两次密码不一致")
		wx.showLoading({
			title: '修改中..',
		})
		let token = wx.getStorageSync('token')
		wx.request({
			url: this.data.url + '/users/password',
			method: 'post',
			header: {
				'Authorization': token
			},
			data: {
				oldPassword: this.data.oldPassword,
				newPassword: this.data.newPassword,
				checkPassword: this.data.checkPassword,
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.showToast({
						title: '修改成功',
					})
					wx.reLaunch({
						url: '/pages/my/my',
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