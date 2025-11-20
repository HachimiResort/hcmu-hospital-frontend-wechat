// pages/my/message/message.js
const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		orderList: [],
		filteredList: [], // 筛选后的列表
		userId: wx.getStorageSync('userId'),
		statusFilter: '', // 预约状态筛选，默认为全部
		deptFilter: '', // 科室筛选，默认为全部
		sortBy: 'schedule', // 排序字段：schedule-就诊时间，create-创建时间
		sortOrder: 'desc', // 排序顺序：asc-升序，desc-降序
		departmentList: [], // 科室列表，动态从数据中提取
		filterVisible: false // 控制筛选部分显示/隐藏，默认隐藏
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		new app.ToastPannel();
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
					let originalList = res.data.data.list;
					// 提取唯一的科室列表
					const departmentSet = new Set();
					originalList.forEach(item => {
						if (item.departmentName) {
							departmentSet.add(item.departmentName);
						}
					});
					const departmentList = Array.from(departmentSet);
					this.setData({
						orderList: originalList,
						departmentList: departmentList
					});
					// 应用筛选和排序
					this.applyFilterAndSort();
				} else {
					this.show(res.data.msg)
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
					// 提取唯一的科室列表
					const departmentSet = new Set();
					res.data.rows.forEach(item => {
						if (item.departmentName) {
							departmentSet.add(item.departmentName);
						}
					});
					const departmentList = Array.from(departmentSet);
					this.setData({
						orderList: res.data.rows,
						departmentList: departmentList
					})
					// 应用筛选和排序
					this.applyFilterAndSort();
				} else if (res.data.code == 204) {
					this.setData({
						orderList: [],
						filteredList: [],
						departmentList: []
					})
				} else {
					console.log(res.data)
					this.show(res.data.msg)
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
	 * 切换状态筛选
	 */
	changeStatusFilter(e) {
		const status = e.currentTarget.dataset.status;
		this.setData({
			statusFilter: status
		});
		this.applyFilterAndSort();
	},

	/**
	 * 切换科室筛选
	 */
	changeDeptFilter(e) {
		const dept = e.currentTarget.dataset.dept;
		this.setData({
			deptFilter: dept
		});
		this.applyFilterAndSort();
	},

	/**
	 * 切换排序方式
	 */
	changeSort(e) {
		const sortBy = e.currentTarget.dataset.sort;
		let sortOrder = this.data.sortOrder;

		// 如果点击的是当前排序字段，则切换排序顺序
		if (sortBy === this.data.sortBy) {
			sortOrder = this.data.sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			// 如果点击的是新的排序字段，默认使用降序
			sortOrder = 'desc';
		}

		this.setData({
			sortBy: sortBy,
			sortOrder: sortOrder
		});

		this.applyFilterAndSort();
	},

	/**
	 * 应用筛选和排序
	 */
	applyFilterAndSort() {
		let list = [...this.data.orderList];

		// 应用状态筛选
		if (this.data.statusFilter !== '') {
			list = list.filter(item => item.status === parseInt(this.data.statusFilter));
		}

		// 应用科室筛选
		if (this.data.deptFilter !== '') {
			list = list.filter(item => item.departmentName === this.data.deptFilter);
		}

		// 应用排序
		list.sort((a, b) => {
			if (this.data.sortBy === 'schedule') {
				// 按就诊时间排序（日期+时段）
				const timeA = `${a.scheduleDate} ${this.getSlotTime(a.slotPeriod)}`;
				const timeB = `${b.scheduleDate} ${this.getSlotTime(b.slotPeriod)}`;
				return this.data.sortOrder === 'asc' ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
			} else if (this.data.sortBy === 'create') {
				// 按创建时间排序
				return this.data.sortOrder === 'asc' ?
					new Date(a.createTime) - new Date(b.createTime) :
					new Date(b.createTime) - new Date(a.createTime);
			}
			return 0;
		});

		this.setData({
			filteredList: list
		});
	},

	/**
	 * 根据时段获取时间文本
	 */
	getSlotTime(slotPeriod) {
		const slotTimes = {
			1: '8:00-8:30',
			2: '8:30-9:00',
			3: '9:00-9:30',
			4: '9:30-10:00',
			5: '10:00-10:30',
			6: '10:30-11:00',
			7: '13:30-14:00',
			8: '14:00-14:30',
			9: '14:30-15:00',
			10: '15:00-15:30',
			11: '15:30-16:00',
			12: '16:00-16:30'
		};
		return slotTimes[slotPeriod] || '';
	},
	
	/**
	 * 切换筛选区域的显示/隐藏状态
	 */
	toggleFilter() {
		this.setData({
			filterVisible: !this.data.filterVisible
		});
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