// pages/my/feedback/feedback.js
const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		typeArray:['挂号相关', '缴费相关', '使用问题'],
		typeIndex: 0,
		select:'请选择问题类型',
		title:'',
		content:'',
		email:'',
		phone:''
	},
	changeValue(e) {
		this.setData({
			typeIndex: e.detail.value,
			select:this.data.typeArray[e.detail.value]
		})
	  },
	  post(){
			if(this.data.title == '' || this.data.content == '') return wx.showToast({
			  title: '请输入完整',
			  icon:'none'
			})
			wx.showLoading({
			  title: '提交中...',
			})
			setTimeout(()=>{
				wx.hideLoading()
				wx.showToast({
					title: '反馈成功，感谢您的反馈...？',
				})
			}, 2000)
	  },
	  his(){
		wx.navigateTo({
		  url: './his/his',
		})
	  },

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {

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
