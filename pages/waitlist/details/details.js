// pages/my/message/message.js
const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		item: {},
		id: '',
		doctor: {}
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		new app.ToastPannel();
		this.setData({
			item: JSON.parse(options.item)
		})
	},
	pay() {
		let that = this;
		wx.showModal({
			title: '支付确认',
			content: '应付:¥' + that.data.item.actualFee,
			success(res) {
				if (res.confirm) {
					wx.showLoading({
						title: '支付中...',
					})
					let token = wx.getStorageSync('token')
					wx.request({
						url: that.data.url + `/waitlists/${that.data.item.waitlistId}/pay`,
						method: 'POST',
						header: {
							'Authorization': token
						},
						success: (res1) => {
							wx.hideLoading()
						if (res1.data.code == 0) {
							that.setData({
								item: res1.data.data
							})
							wx.showToast({
								title: '支付成功',
							})
							// 支付成功后跳转到首页，并在首页自动进入 make 列表
							wx.setStorageSync('redirectToMakeAfterPay', '1')
							wx.switchTab({
								url: '/pages/index/index'
							})
						} else {
							that.show(res1.data.msg)
						}
						}
					})
				} else if (res.cancel) {
				}
			}
		})
	},
	cancel() {
		let that = this;
		wx.showModal({
			title: '确认取消候补？',
			content: '取消后不可恢复，是否确认取消？',
			success(res) {
				if (res.confirm) {
					wx.showLoading({
						title: '取消中...',
					})
					let token = wx.getStorageSync('token')
					wx.request({
						url: that.data.url + `/waitlists/${that.data.item.waitlistId}/cancel`,
						method: 'POST',
						header: {
							'Authorization': token
						},
						success: (res1) => {
							wx.hideLoading()
							if (res1.data.code == 0) {
								that.setData({
									item: res1.data.data
								})
								wx.showToast({
									title: '已取消',
								})
							} else {
								that.show(res1.data.msg)
							}
						}
					})
				} else if (res.cancel) {
				}
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
