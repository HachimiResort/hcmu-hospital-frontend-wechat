// pages/my/my.js
const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		isLogin: false,
		info: {},
		msgNum: 0
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		new app.ToastPannel();
		wx.showLoading({
			title: '加载中...',
		})
		this.url = getApp().globalData.$url;
		let token = wx.getStorageSync('token')
		wx.request({
			url: this.url + '/users/' + wx.getStorageSync('userId'),
			method: 'get',
			header: {
				'Authorization': token
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.setStorageSync('userName', res.data.data.userName);
					wx.setStorageSync('name', res.data.data.name);
					wx.setStorageSync('userId', res.data.data.userId);
					wx.setStorageSync('userInfo', res.data.data);
					this.setData({
						info: res.data.data,
						isLogin: true
					})
					console.log(this.data.info);
				} else {
					this.setData({
						isLogin: false
					})
				}
			}
		})
	},
	getInfo() {
		let token = wx.getStorageSync('token')
		wx.request({
			url: this.url + '/users/' + wx.getStorageSync('userId'),
			method: 'get',
			header: {
				'Authorization': token
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.setStorageSync('userName', res.data.data.userName);
					wx.setStorageSync('name', res.data.data.name);
					wx.setStorageSync('userId', res.data.data.userId)
					this.setData({
						info: res.data.data,
						isLogin: true
					})
				} else {
					this.setData({
						isLogin: false
					})
				}
			}
		})
	},
	sign() {
		if (this.data.isLogin) {
			wx.navigateTo({
				url: './info/info',
			})
		} else {
			wx.navigateTo({
				url: '/pages/sign/sign',
			})
		}
	},
	feedback() {
		if (this.data.isLogin) {
			wx.navigateTo({
				url: './feedback/feedback',
			})
		}
	},
	out() {
		if (!this.data.isLogin) return
		let that = this
		wx.showModal({
			title: '提示',
			content: '确认退出登录吗？',
			success(res) {
				console.log(that.url);
				if (res.confirm) {
					wx.request({
						url: that.url + '/auth/logout/' + wx.getStorageSync('userId'),
						method: 'post',
						success: (res1) => {
							console.log(res1);
						},
						fail: (err) => {
							console.log(err);
							this.show("请检查网络连接")
						}
					})
					wx.setStorageSync('token', '')
					wx.setStorageSync('userId', '')
					that.setData({
						isLogin: false,
						info: {},
						msgNum: 0
					})
				} else if (res.cancel) {
					// console.log('用户点击取消')
				}
			}
		})
	},
	waitlist() {
		if (this.data.isLogin) {
			wx.navigateTo({
				url: '../waitlist/waitlist',
			})
		}else {
			wx.navigateTo({
				url: '/pages/sign/sign',
			})
		}
	},
	make() {
		if (this.data.isLogin) {
			wx.navigateTo({
				url: '../make/make',
			})
		}else {
			wx.navigateTo({
				url: '/pages/sign/sign',
			})
		}
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
		this.getInfo()
		if (this.data.isLogin) {
			let userId = wx.getStorageSync('userId');
			let token = wx.getStorageSync('token')
			wx.request({
				url: this.data.url + `/simple/getMessageNum?userId=${userId}`,
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