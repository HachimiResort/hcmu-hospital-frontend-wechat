// pages/sign/sign.js
const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url:getApp().globalData.$url,
		email:'',
		code:'',
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		new app.ToastPannel();
		this.url = getApp().globalData.$url;
	},
	register(){
		if(this.data.email=="") return wx.showToast({
		  title: '请输入邮箱',
		  icon:'none'
		})
		wx.showLoading({
		  title: '获取中..',
		})
		let token = wx.getStorageSync('token')
		wx.request({
		  url: this.data.url + '/users/email',
		  method:'post',
		  header: {
			'Authorization': token
		},
		  data:{
			email:this.data.email
		  },
		  success:(res)=>{
			  wx.hideLoading()
			  if(res.data.code == 200){
				  wx.showToast({
					title: '验证码已发送',
				  })
			  }else{
				  wx.showToast({
					title: res.data.msg,
					icon:'none'
				  })
			  }
		  },
		  fail:(err)=>{
			wx.hideLoading()
			  wx.showToast({
				title: '请检查网络连接',
				icon:'none'
			  })
		  }
		})
	},
	into(){
		if(this.data.email=="") return wx.showToast({
		  title: '请输入邮箱',
		  icon:'none'
		})
		if(this.data.code=="") return wx.showToast({
		  title: '请输入验证码',
		  icon:'none'
		})
		wx.showLoading({
		  title: '修改中..',
		})
		let token = wx.getStorageSync('token')
		wx.request({
		  url: this.data.url + '/users/email/verify',
		  method:'post',
		  header: {
			'Authorization': token
		},
		  data:{
			email:this.data.email,
			code:this.data.code
		  },
		  success:(res)=>{
			  wx.hideLoading()
			  if(res.data.code == 200){
				  wx.showToast({
					title: '修改成功',
				  })
				  wx.relaunch({
					url: 'pages/my/my',
				  })
			  }else{
				  wx.showToast({
					title: res.data.msg,
					icon:'none'
				  })
			  }
		  },
		  fail:(err)=>{
			wx.hideLoading()
			  wx.showToast({
				title: '请检查网络连接',
				icon:'none'
			  })
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