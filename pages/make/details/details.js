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
						url: that.data.url + `/appointments/${that.data.item.appointmentId}/pay`,
						method: 'PUT',
						header: {
							'Authorization': token
						},
						success: (res1) => {
							wx.hideLoading()
							if (res1.data.code == 200) {
								that.setData({
									item: res1.data.data
								})
								wx.showToast({
									title: '支付成功',
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
							url: that.data.url + `/appointments/${that.data.item.appointmentId}/cancel`,
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
					} else {
						that.show("请输入取消原因")
					}
				} else if (res.cancel) {

				}
			}
		})
	},
	scanCode() {
		wx.scanCode({
			scanType: ['qrCode', 'barCode'],
			success: (res) => {
				const key = (res.result || '').trim()
				if (!key) {
					this.show('扫码结果为空')
					return
				}
				const that = this
				wx.showLoading({
					title: '请等待...',
				})
				wx.request({
					url: `${that.data.url}/appointments/${that.data.item.appointmentId}/signIn`,
					method: 'PUT',
					data: { key: key },
					header: {
						'Authorization': wx.getStorageSync('token')
					},
					success: (res1) => {
						wx.hideLoading();
						if (res1.data.code == 200) {
							that.setData({ item: res1.data.data })
							wx.showToast({ title: '成功签到' })
						} else {
							that.show(res1.data.msg)
						}
					},
					fail: () => {
						that.show('请检查网络连接')
					}
				})
			},
			fail: () => {
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
