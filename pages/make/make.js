// pages/my/message/message.js
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		orderList: [],
		userId: wx.getStorageSync('userId'),
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		let token = wx.getStorageSync('token')
		wx.showLoading({
			title: '加载中...',
		})
		wx.request({
			url: this.data.url + `/patient-profiles/${this.data.userId}/appointments`,
			header: {
				'Authorization': token
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					this.setData({
						orderList: res.data.data.list
					})
				} else {
					wx.showToast({
						title: res.data.msg,
						icon: 'error'
					})
				}
			}
		})
	},

	changeValue(e) {
		wx.showLoading({
			title: '切换中...',
		})
		this.setData({
			defPat: this.data.patList[e.detail.value],
			name: this.data.patList[e.detail.value].name,
			relation: this.data.patList[e.detail.value].relation,
			certificate: this.data.patList[e.detail.value].certificate,
			ind: e.detail.value
		})
		let token = wx.getStorageSync('token')
		let url = this.data.url + `/make/userGetList?patId=${this.data.patList[e.detail.value].id}`;
		if (this.data.type == 'index') url = this.data.url + `/make/userGetList?patId=${this.data.patList[e.detail.value].id}&state=0`
		wx.request({
			url: url,
			header: {
				'Authorization': token
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					this.setData({
						orderList: res.data.rows
					})
				} else if (res.data.code == 204) {
					this.setData({
						orderList: []
					})
				} else {
					console.log(res.data)
					wx.showToast({
						title: res.data.msg,
						icon: 'error'
					})
				}
			}
		})
	},
	uigo(e) {
		console.log(e.currentTarget.dataset);
		wx.navigateTo({
			url: `./details/details?item=${JSON.stringify(e.currentTarget.dataset.data)}`,
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
		this.onLoad()
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