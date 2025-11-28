// pages/appointment/hosChange/hosChange.js
const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		docId: 0,
		doctor: {},
		scheduleList: [],
		scheduleChoice: 0,
		doctorList: [],
		time: '',
		hosName: '',
		depName: '',
		doctorId: '',
		weekType: 1,
		arrange: {}
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		new app.ToastPannel();
		this.setData({
			docId: parseInt(options.docId)
		})
		// 获取当天日期和7天后日期
		const today = new Date();
		const sevenDaysLater = new Date();
		sevenDaysLater.setDate(today.getDate() + 7);

		// 格式化日期为YYYY-MM-DD格式
		const formatDate = (date) => {
			return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
		};

		wx.showLoading({
			title: '加载中...',
		})
		let token = wx.getStorageSync('token')
		wx.request({
			url: this.data.url + `/doctor-profiles/` + options.docId,
			header: {
				'Authorization': token
			},
			type: 'GET',
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {
					this.setData({
						doctor: res.data.data
					})
				} else {
					this.show(res.data.msg)
				}
			},
			fail: (err) => {
				console.log(err)
				wx.hideLoading()
				this.show("请检查网络连接")
			}
		})
		let requestDTO = {
			doctorUserId: this.data.docId,
			scheduleStartDate: formatDate(today),
			scheduleEndDate: formatDate(sevenDaysLater)
		}
		console.log(requestDTO);
		wx.request({
			url: this.data.url + `/schedules`,
			header: {
				'Authorization': token
			},
			data: requestDTO,
			success: (res) => {
				wx.hideLoading()
				if (res.data.code == 200) {

					// 将res.data.data.list按scheduleDate分组
					const arr = [];
					// 使用Map来按日期分组
					const dateMap = new Map();

					// 遍历所有日程，按日期分组
					res.data.data.list.forEach(item => {
						if (!dateMap.has(item.scheduleDate)) {
							dateMap.set(item.scheduleDate, []);
						}
						dateMap.get(item.scheduleDate).push(item);
					});

					// 转换Map为要求的数组格式，并对每个日期的schedules按slotPeriod排序
					dateMap.forEach((scheduleItems, date) => {
						// 按slotPeriod从小到大排序
						scheduleItems.sort((a, b) => a.slotPeriod - b.slotPeriod);
						arr.push({
							scheduleDate: date,
							schedules: scheduleItems
						});
					});

					// 按日期排序
					arr.sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));

					console.log(arr);
					this.setData({
						scheduleList: arr
					})
				} else {
					this.show(res.data.msg)
				}
			}
		})
	},
	changeSchedule(e) {
		console.log(e.currentTarget.dataset.index);
		this.setData({
			scheduleChoice: e.currentTarget.dataset.index
		})
	},
	addWaitlist(e) {
		const patientName = wx.getStorageSync('name') || '未设置';
		const doctorName = this.data.doctor.name || '医生信息未加载';
		const appointmentInfo = e.currentTarget.dataset.info || {};

		// 根据挂号信息获取详细显示内容
		let slotTypeText = '';
		switch (appointmentInfo.slotType) {
			case 1: slotTypeText = '普通'; break;
			case 2: slotTypeText = '专家'; break;
			default: slotTypeText = '特需';
		}

		let slotPeriodText = '';
		switch (appointmentInfo.slotPeriod) {
			case 1: slotPeriodText = '8:00-8:30'; break;
			case 2: slotPeriodText = '8:30-9:00'; break;
			case 3: slotPeriodText = '9:00-9:30'; break;
			case 4: slotPeriodText = '9:30-10:00'; break;
			case 5: slotPeriodText = '10:00-10:30'; break;
			case 6: slotPeriodText = '10:30-11:00'; break;
			case 7: slotPeriodText = '13:30-14:00'; break;
			case 8: slotPeriodText = '14:00-14:30'; break;
			case 9: slotPeriodText = '14:30-15:00'; break;
			case 10: slotPeriodText = '15:00-15:30'; break;
			case 11: slotPeriodText = '15:30-16:00'; break;
			case 12: slotPeriodText = '16:00-16:30'; break;
			default: slotPeriodText = appointmentInfo.slotPeriod;
		}

		const appointmentDetails = `
患者姓名：${patientName}\n
医生姓名：${doctorName}\n
挂号类型：${slotTypeText}\n
挂号时间：${appointmentInfo.scheduleDate} ${slotPeriodText}\n
挂号费用：¥${appointmentInfo.fee || 0}
		`;

		wx.showModal({
			title: '确认候补',
			content: appointmentDetails,
			success: (res) => {
				if (res.confirm) {
					wx.showLoading({
						title: '加载中...',
					})
					let token = wx.getStorageSync('token')
					wx.request({
						url: this.data.url + `/waitlists/join`,
						header: {
							'Authorization': token
						},
						method: 'POST',
						data: {
							"userId": wx.getStorageSync('userId'),
    						"scheduleId": appointmentInfo.scheduleId
						},
						success: (res) => {
							wx.hideLoading()
							if (res.data.code == 200) {
								wx.hideLoading()
								wx.reLaunch({
									url: '/pages/index/index',
								})
							} else {
								wx.hideLoading()
								this.show(res.data.msg)
							}
						},
						fail: (err) => {
							console.log(err)
							wx.hideLoading()
							this.show("请检查网络连接")
						}
					})
				}
			}
		});
	},
	bookAppointment(e) {
		const patientName = wx.getStorageSync('name') || '未设置';
		const doctorName = this.data.doctor.name || '医生信息未加载';
		const appointmentInfo = e.currentTarget.dataset.info || {};

		// 根据挂号信息获取详细显示内容
		let slotTypeText = '';
		switch (appointmentInfo.slotType) {
			case 1: slotTypeText = '普通'; break;
			case 2: slotTypeText = '专家'; break;
			default: slotTypeText = '特需';
		}

		let slotPeriodText = '';
		switch (appointmentInfo.slotPeriod) {
			case 1: slotPeriodText = '8:00-8:30'; break;
			case 2: slotPeriodText = '8:30-9:00'; break;
			case 3: slotPeriodText = '9:00-9:30'; break;
			case 4: slotPeriodText = '9:30-10:00'; break;
			case 5: slotPeriodText = '10:00-10:30'; break;
			case 6: slotPeriodText = '10:30-11:00'; break;
			case 7: slotPeriodText = '13:30-14:00'; break;
			case 8: slotPeriodText = '14:00-14:30'; break;
			case 9: slotPeriodText = '14:30-15:00'; break;
			case 10: slotPeriodText = '15:00-15:30'; break;
			case 11: slotPeriodText = '15:30-16:00'; break;
			case 12: slotPeriodText = '16:00-16:30'; break;
			default: slotPeriodText = appointmentInfo.slotPeriod;
		}

		const appointmentDetails = `
患者姓名：${patientName}\n
医生姓名：${doctorName}\n
挂号类型：${slotTypeText}\n
挂号时间：${appointmentInfo.scheduleDate} ${slotPeriodText}\n
挂号费用：¥${appointmentInfo.fee || 0}
		`;

		wx.showModal({
			title: '确认预约',
			content: appointmentDetails,
			success: (res) => {
				if (res.confirm) {
					wx.showLoading({
						title: '加载中...',
					})
					let token = wx.getStorageSync('token')
					wx.request({
						url: this.data.url + `/schedules/` + appointmentInfo.scheduleId + `/appoint`,
						header: {
							'Authorization': token
						},
						method: 'POST',
						success: (res) => {
							wx.hideLoading()
							if (res.data.code == 200) {
								wx.hideLoading()
								wx.reLaunch({
									url: '/pages/index/index',
								})
							} else {
								wx.hideLoading()
								this.show(res.data.msg)
							}
						},
						fail: (err) => {
							console.log(err)
							wx.hideLoading()
							this.show("请检查网络连接")
						}
					})
				}
			}
		});
	},
	uigoDoctor(e) {
		const pages = getCurrentPages()
		const perpage = pages[pages.length - 1] //当前页面
		let keys = `?depTwoId=${this.data.depTwoId}&hosName=${this.data.hosName}&depName=${this.data.depName}&doctorId=${e.currentTarget.dataset.orderid}`
		// wx.reLaunch({
		// 	url: '/' + perpage.route + keys
		//  })	
		wx.navigateTo({
			url: '/' + perpage.route + keys
		})

	},
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