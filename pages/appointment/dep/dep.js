// pages/appointment/dep/dep.js
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		depList: [],
		depChoice: [],
		docList: [],
		chiose: [],
		userInfo: {}
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {

		this.setData({
			userInfo: wx.getStorageSync('userInfo')
		})
		let token = wx.getStorageSync('token')
		wx.showLoading({
			title: '加载中...',
		})
		new Promise((resolve, reject) => {
			wx.request({
				url: this.data.url + '/departments',
				header: {
					'Authorization': token
				},
				success: (res) => {
					if (res.data.data.total == 0) return wx.hideLoading()
					if (res.data.code == 200) {
						resolve(res.data.data.list)
					} else if (res.data.code == 403) {
						getApp().notPermission()
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
		}).then(res => {
			let arr = new Array(res.length).fill(false);
			arr[0] = true;
			this.setData({
				depList: res,
				depChoice: arr,
			})
			return new Promise((resolve, reject) => {
				wx.request({
					url: this.data.url + `/departments/${res[0].departmentId}/doctors`,
					header: {
						'Authorization': token
					},
					success: (res) => {
						if (res.data.code == 200) {
							this.setData({
								docList: res.data.data.list,
							})
							wx.hideLoading()
						} else {
							wx.showToast({
								title: res.data.msg,
								icon: 'error'
							})
						}
					}
				})
			})
		}).catch(err => {
			wx.hideLoading()
			wx.showToast({
				title: '出现错误',
				icon: 'error'
			})
			console.log(err)
		})
	},
	depChange(e) {
		if (e.currentTarget.dataset.index == this.data.depChoice.indexOf(true)) return
		let arr = new Array(this.data.depChoice.length).fill(false);
		arr[e.currentTarget.dataset.index] = true;
		this.setData({
			depChoice: arr
		})
		let token = wx.getStorageSync('token')
		wx.showLoading({
			title: '加载中...',
		})
		console.log(this.data.depList[e.currentTarget.dataset.index].departmentId)
		wx.request({
			url: this.data.url + `/departments/${this.data.depList[e.currentTarget.dataset.index].departmentId}/doctors`,
			header: {
				'Authorization': token
			},
			success: (res) => {
				if (res.data.code == 200) {
					let arr1 = new Array(res.length).fill(false);
					arr1[0] = true;
					this.setData({
						docList: res.data.data.list,
					})
					wx.hideLoading()
				} else {
					wx.showToast({
						title: res.data.msg,
						icon: 'error'
					})
				}
			}
		})
		console.log(this.data.docList);
	},
	go(e) {
		console.log(this.data.docList);
		console.log(e);
		wx.navigateTo({
			url: `../doctorInfo/doctorInfo?docId=${e.currentTarget.dataset.name}`,
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