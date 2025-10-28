// pages/sign/sign.js
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		userName: '',
		name: '',
		nickname: '',
		phone: '',
		email: '',
		info: {},
		avatar: '',
		isMod: false
	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		wx.showLoading({
			title: '加载中...',
		})
		let token = wx.getStorageSync('token')
		this.url = getApp().globalData.$url;
		wx.request({
			url: this.url + '/users/' + wx.getStorageSync('userId'),
			header: {
				'Authorization': token
			},
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					this.setData({
						info: res.data.data,
						userName: res.data.data.userName,
						name: res.data.data.name,
						nickname: res.data.data.nickname,
						phone: res.data.data.phone,
						email: res.data.data.email,
					})
				} else {
					wx.navigateBack({
						delta: 1,
					})
					wx.showToast({
						title: '出现错误',
						icon: 'error'
					})
				}
			},
			fail: (err) => {
				wx.navigateBack({
					delta: 1,
				})
				wx.showToast({
					title: '请检查网络连接',
					icon: 'none'
				})
			}
		})
	},
	change() {
	},
	register() {
		if (this.data.nickname == "") return wx.showToast({
			title: '请输入完整',
			icon: 'error'
		})
		wx.showLoading({
			title: '修改中...',
		})
		let data = {
			nickname: this.data.nickname,
			phone: this.data.phone,
		}
		let token = wx.getStorageSync('token')
		wx.request({
			url: this.url + '/users/' + wx.getStorageSync('userId'),
			method: 'put',
			data: data,
			header: {
				'Authorization': token
			},
			success: (res) => {
				console.log(res)
				wx.hideLoading()
				if (res.data.code == 200) {
					wx.showToast({
						title: '修改成功',
					})
				} else {
					wx.showToast({
						title: res.data.msg,
						icon: 'error'
					})
				}
			},
			fail: (err) => {
				wx.hideLoading()
				wx.showToast({
					title: '请检查网络连接',
					icon: 'error'
				})
			}
		})
	},
	modAvatar() {
		let that = this;
		if (!this.data.isMod) {
			//选择图片
			wx.chooseMedia({
				count: 1,
				mediaType: ['image'],
				sourceType: ['album', 'camera'],
				camera: 'back',
				success(res) {
					that.setData({
						avatar: res.tempFiles[0].tempFilePath,
						isMod: true
					})
				}
			})
		} else {
			//上传
			wx.showLoading({
				title: '上传中...',
			})
			let token = wx.getStorageSync('token')
			wx.uploadFile({
				url: this.data.url + '/modify/avatar',
				filePath: this.data.avatar,
				name: 'avatar',
				header: {
					'Authorization': token
				},
				success(rest) {
					wx.hideLoading()
					let res = JSON.parse(rest.data)
					if (res.code == 200) {
						that.setData({
							avatar: that.data.url + res.data,
							isMod: false
						})
						wx.showToast({
							title: '修改成功',
						})
					} else {
						wx.showToast({
							title: res.msg,
							icon: "error"
						})
					}
				},
				fail: (err) => {
					wx.showToast({
						title: '请检查网络连接',
						icon: "error"
					})
				}
			})
		}
	},
	look() {
		if (this.data.isMod) return
		wx.previewImage({
			current: this.data.avatar,
			urls: [this.data.avatar],
		})
	},
	uigo() {
		wx.navigateTo({
			url: '../modPass/modPass',
		})
	},
	changeEmail() {
		console.log(this.data.email)
		wx.navigateTo({
			url: '../modEmail/modEmail',
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