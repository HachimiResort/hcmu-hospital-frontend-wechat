// pages/index.js
const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		swiper: [],
		msgNum: 0
	},
	swiperUigo: (id) => {
		wx.navigateTo({
			url: `/pages/article/content/content?id=${id.currentTarget.dataset.patid}`,
		})
	},
	info() {
		let token = wx.getStorageSync('token')
		wx.showLoading({
			title: '加载中...',
		})
		wx.request({
			url: this.data.url + '/departments',
			header: {
				'Authorization': token
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.navigateTo({
						url: '/pages/my/info/info',
					})
				} else {
					wx.navigateTo({
						url: '/pages/sign/sign',
					})
				}
			},
			fail: (err) => {
				wx.hideLoading()
				this.show("请检查网络连接")
			}
		})

	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		new app.ToastPannel();
	},
	imageError($event) {
		let arr = this.data.swiper
		arr[$event.currentTarget.dataset.index].imgUrl = '../../image/bg.png';
		this.setData({
			swiper: arr
		})
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {
	},
	navUigo() {
		let token = wx.getStorageSync('token')
		wx.showLoading({
			title: '加载中...',
		})
		wx.request({
			url: this.data.url + `/patient-profiles/${wx.getStorageSync('userId')}/appointments`,
			header: {
				'Authorization': token
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.navigateTo({
						url: '/pages/navigation/navigation',
						//可以在url后加上?selectedStartPointId=1&selectedEndPointId=20.
					})
				} else {
					wx.navigateTo({
						url: '/pages/sign/sign',
					})
				}
			},
			fail: (err) => {
				wx.hideLoading()
				this.show("请检查网络连接")
			}
		})

	},
	indexMake() {
		let token = wx.getStorageSync('token')
		wx.showLoading({
			title: '加载中...',
		})
		wx.request({
			url: this.data.url + `/patient-profiles/${wx.getStorageSync('userId')}/appointments`,
			header: {
				'Authorization': token
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.navigateTo({
						url: '/pages/make/make',
					})
				} else {
					wx.navigateTo({
						url: '/pages/sign/sign',
					})
				}
			},
			fail: (err) => {
				wx.hideLoading()
				this.show("请检查网络连接")
			}
		})
	},
	waitlist() {
		let token = wx.getStorageSync('token')
		wx.showLoading({
			title: '加载中...',
		})
		wx.request({
			url: this.data.url + `/patient-profiles/${wx.getStorageSync('userId')}/waitlists`,
			header: {
				'Authorization': token
			},
			data: {
				patientUserId: wx.getStorageSync('userId')
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.navigateTo({
						url: '/pages/waitlist/waitlist',
					})
				} else {
					wx.navigateTo({
						url: '/pages/sign/sign',
					})
				}
			},
			fail: (err) => {
				wx.hideLoading()
				this.show("请检查网络连接")
			}
		})
	},
	ai() {
		let token = wx.getStorageSync('token')
		wx.showLoading({
			title: '加载中...',
		})
		wx.request({
			url: this.data.url + '/departments',
			header: {
				'Authorization': token
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.navigateTo({
						url: '../ai/ai',
					})
				} else {
					wx.navigateTo({
						url: '/pages/sign/sign',
					})
				}
			},
			fail: (err) => {
				wx.hideLoading()
				this.show("请检查网络连接")
			}
		})


	},
	make() {
		let token = wx.getStorageSync('token')
		wx.showLoading({
			title: '加载中...',
		})
		wx.request({
			url: this.data.url + '/departments',
			header: {
				'Authorization': token
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.navigateTo({
						url: '../appointment/dep/dep',
					})
				} else {
					wx.navigateTo({
						url: '/pages/sign/sign',
					})
				}
			},
			fail: (err) => {
				wx.hideLoading()
				this.show("请检查网络连接")
			}
		})

	},
	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function () {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	}
})
