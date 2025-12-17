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
	message() {
		wx.navigateTo({
			url: '../my/message/message',
		})
	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		new app.ToastPannel();
		/*wx.showLoading({
			title: '加载中...',
		})
		this.url = getApp().globalData.$url;
		wx.request({
			url: this.url + '/api/swiper',
			method: 'get',
			success: (res) => {
				wx.hideLoading()
				this.setData({
					swiper: res.data.data
				})
				let userId = wx.getStorageSync('userId')
				let token = wx.getStorageSync('token')
				wx.request({
					url: this.url + `/simple/getMessageNum?userId=${userId}`,
					method: 'get',
					header: {
						'Authorization': token
					},
					success: (reslut) => {
						this.setData({
							msgNum: reslut.data.num == null ? 0 : reslut.data.num
						})
					}
				})
			}
		})*/
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
		let userId = wx.getStorageSync('userId')
		let token = wx.getStorageSync('token')
		wx.request({
			url: this.url + `/simple/getMessageNum?userId=${userId}`,
			method: 'get',
			header: {
				'Authorization': token
			},
			success: (reslut) => {
				this.setData({
					msgNum: reslut.data.num == null ? 0 : reslut.data.num
				})
			}
		})
		// 如果支付成功后需要自动进入 make 列表
		const needRedirect = wx.getStorageSync('redirectToMakeAfterPay')
		if (needRedirect === '1') {
			wx.removeStorageSync('redirectToMakeAfterPay')
			this.indexMake()
		}
	},
	course_uigo() {
		wx.navigateTo({
			url: '/pages/course/course',
		})
	},
	articleUigo(e) {
		wx.navigateTo({
			url: `/pages/article/article?name=${e.currentTarget.dataset.name}`,
		})
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
	indexPay() {
		wx.navigateTo({
			url: '../my/payOrder/payOrder?type=index'
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
