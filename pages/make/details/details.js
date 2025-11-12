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
						url: that.data.url + `/appointments/${that.data.id}/pay`,
						method: 'POST',
						header: {
							'Authorization': token
						},
						success: (res1) => {
							wx.hideLoading()
							if (res1.data.code == 200) {
								this.setData({
									item: res1.data.data
								})
								wx.showToast({
									title: '支付成功',
								})
							} else {
								wx.showToast({
									title: '暂时无法支付',
									icon:'none',
								})
								// this.show(res1.data.msg)
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
			title: '确定要取消预约吗？',
			editable: true,
			placeholderText: '请输入取消原因',
			success(res) {
				if (res.confirm) {
					if (res.content != '') {
						wx.showLoading({
							title: '取消中...',
						})
						let token = wx.getStorageSync('token')
						wx.request({
							url: that.data.url + `/appointments/${that.data.id}/cancel`,
							method: 'PUT',
							data: {
								reason: res.content
							},
							header: {
								'Authorization': token
							},
							success: (res1) => {
								wx.hideLoading()
								if (res1.data.code == 200) {
									this.setData({
										item: res1.data.data
									})
									wx.showToast({
										title: '已取消',
									})
								} else {
									this.show(res.data.msg)
								}
							}
						})
					} else {
						this.show("请输入取消原因")
					}
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