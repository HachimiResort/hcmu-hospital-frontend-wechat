// pages/appointment/dep/dep.js
const app = getApp()
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
		userInfo: {},
		departmentId: 0,
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		new app.ToastPannel();
		this.setData({
			userInfo: wx.getStorageSync('userInfo'),
			departmentId: options.departmentId || 0,
		})
		let token = wx.getStorageSync('token')
		wx.showLoading({
			title: '加载中...',
		})
		new Promise((resolve, reject) => {
			wx.request({
				url: this.data.url + '/departments?pageSize=10000&parentId=0',
				header: {
					'Authorization': token
				},
				success: (res) => {
					if (res.data.code == 200) {
						if (res.data.data.total == 0) return wx.hideLoading()
						resolve(res.data.data.list)
					} else if (res.data.code == 403) {
						getApp().notPermission()
					} else {
						this.show(res.data.msg)
					}
				},
				fail: (err) => {
					wx.hideLoading()
					this.show("请检查网络连接")
				}
			})
		}).then(res => {
			let arr = new Array(res.length).fill(false);
			let defaultIndex = 0;
			if (options && options.departmentId) {
				const idx = res.findIndex(item => String(item.departmentId) === String(options.departmentId));
				if (idx === -1) {
					wx.hideLoading();
					wx.navigateBack({ delta: 1 });
					return;
				}else{
					defaultIndex = idx;
				}
			}
			arr[defaultIndex] = true;
			this.setData({
				depList: res,
				depChoice: arr,
				departmentId: res[defaultIndex].departmentId,
			})
			return new Promise((resolve, reject) => {
				wx.request({
					url: this.data.url + `/departments?pageSize=10000&parentId=${res[defaultIndex].departmentId}`,
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
							this.show(res.data.msg)
						}
					}
				})
			})
		}).catch(err => {
			wx.hideLoading()
			this.show("请检查网络连接")
			console.log(err)
		})
	},
	depChange(e) {
		if (e.currentTarget.dataset.index == this.data.depChoice.indexOf(true)) return
		this.setData({
			departmentId: this.data.depList[e.currentTarget.dataset.index].departmentId,
		})
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
			url: this.data.url + `/departments?pageSize=10000&parentId=${this.data.depList[e.currentTarget.dataset.index].departmentId}`,
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
					this.show(res.data.msg)
				}
			}
		})
		console.log(this.data.docList);
	},
	go(e) {
		console.log(this.data.docList);
		console.log(e);
		//console.log(this.data.docList[e.currentTarget.dataset.id]);
		wx.navigateTo({
			url: `./dep/dep?parentId=${this.data.departmentId}&departmentId=${e.currentTarget.dataset.name}`,
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
