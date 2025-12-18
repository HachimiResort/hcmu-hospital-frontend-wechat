// pages/my/message/message.js
const app = getApp()
const BEACON_UUID = '38cb4c33-0587-49de-8c0e-a0370261f321'
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		item: {},
		id: '',
		doctor: {}
	},
	navigate() {
		const that = this
		wx.showActionSheet({
			itemList: ['二维码导航', '蓝牙导航'],
			success(res) {
				if (res.tapIndex === 0) {
					wx.scanCode({
						scanType: ['qrCode', 'barCode'],
						success: (res) => {
							const raw = (res.result || '').trim()
							if (!raw) {
								that.show('扫码结果为空')
								return
							}
							let loc = ''
							try {
								const obj = JSON.parse(raw)
								const v = obj && (obj['location-id'] != null ? obj['location-id'] : obj['locationId'])
								if (typeof v === 'string') loc = v.trim()
								else if (v != null) loc = String(v)
							} catch (e) {
								loc = ''
							}
							const sid = Number(loc)
							if (!isFinite(sid)) {
								that.show('二维码错误')
								return
							}
							const eid = Number(that.data.doctor && that.data.doctor.locationId)
							if (!isFinite(eid)) {
								that.show('未获取到医生位置')
								return
							}
							wx.navigateTo({
								url: `/pages/navigation/navigation?selectedStartPointId=${sid}&selectedEndPointId=${eid}`
							})
						},
						fail: () => { }
					})
				} else if (res.tapIndex === 1) {
					that.startBluetoothNavigate()
				}
			}
		})
	},
	startBluetoothNavigate() {
		const that = this
		let completed = false
		let timer = null
		const finish = (sid) => {
			if (completed) return
			completed = true
			try { if (wx.offBeaconUpdate) wx.offBeaconUpdate() } catch (e) { }
			try { wx.stopBeaconDiscovery({}) } catch (e) { }
			try { if (timer) clearTimeout(timer) } catch (e) { }
			wx.hideLoading()
			const eid = Number(that.data.doctor && that.data.doctor.locationId)
			if (!isFinite(eid)) {
				that.show('未获取到医生位置')
				return
			}
			if (!isFinite(sid)) {
				that.show('蓝牙信标数据错误')
				return
			}
			wx.navigateTo({
				url: `/pages/navigation/navigation?selectedStartPointId=${sid}&selectedEndPointId=${eid}`
			})
		}
		wx.showLoading({
			title: '正在搜索附近蓝牙信标...',
		})
		wx.startBeaconDiscovery({
			uuids: [BEACON_UUID],
			success: () => {
				timer = setTimeout(() => {
					if (completed) return
					completed = true
					try { if (wx.offBeaconUpdate) wx.offBeaconUpdate() } catch (e) { }
					try { wx.stopBeaconDiscovery({}) } catch (e) { }
					wx.hideLoading()
					that.show('附近未发现蓝牙信标')
				}, 10000)
				wx.onBeaconUpdate((res) => {
					if (completed) return
					const list = Array.isArray(res && res.beacons) ? res.beacons : []
					if (!list.length) return
					let nearest = null
					for (let i = 0; i < list.length; i++) {
						const b = list[i]
						if (!nearest) {
							nearest = b
							continue
						}
						const a2 = Number(b.accuracy)
						const a1 = Number(nearest.accuracy)
						const v2 = isFinite(a2) && a2 >= 0
						const v1 = isFinite(a1) && a1 >= 0
						if (v2 && v1) {
							if (a2 < a1) nearest = b
						} else if (v2 && !v1) {
							nearest = b
						} else if (!v2 && !v1) {
							const r2 = Number(b.rssi)
							const r1 = Number(nearest.rssi)
							if (isFinite(r2) && isFinite(r1)) {
								if (r2 > r1) nearest = b
							}
						}
					}
					const sid = Number(nearest && nearest.major)
					if (!isFinite(sid)) return
					if (timer) { try { clearTimeout(timer) } catch (e) { } timer = null }
					finish(sid)
				})
			},
			fail: () => {
				wx.hideLoading()
				that.show('蓝牙导航不可用，请检查蓝牙和定位权限')
			}
		})
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		new app.ToastPannel();
		this.setData({
			item: JSON.parse(options.item)
		})
		console.log(this.data.item);
		wx.showLoading({
			title: '加载中...',
		})
		let token = wx.getStorageSync('token')
		wx.request({
			url: this.data.url + `/doctor-profiles/` + this.data.item.doctorUserId,
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
					console.log(this.data.doctor);
				} else {
					this.show(res.data.msg)
				}
			},
			fail: (err) => {
				wx.hideLoading()
				this.show("请检查网络连接")
			}
		})
	},
	pay() {
		let that = this;
		wx.showModal({
			title: '支付确认',
			content: '应付:¥' + that.data.item.actualFee,
			success(res) {
				if (res.confirm) {
					wx.showLoading({
						title: '支付中...',
					})
					let token = wx.getStorageSync('token')
					wx.request({
						url: that.data.url + `/appointments/${that.data.item.appointmentId}/pay`,
						method: 'PUT',
						header: {
							'Authorization': token
						},
						success: (res1) => {
							wx.hideLoading()
							if (res1.data.code == 200) {
								that.setData({
									item: res1.data.data
								})
								wx.showToast({
									title: '支付成功',
								})
							} else {
								that.show(res1.data.msg)
							}
						}
					})
				} else if (res.cancel) {

				}
			}
		})
	},
	cancel() {
		let that = this;
		wx.showModal({
			title: '确定要取消预约吗？',
			editable: true,
			placeholderText: '请输入取消原因',
			success(res) {
				if (res.confirm) {
					if (res.content != '') {
						wx.showLoading({
							title: '取消中...',
						})
						let token = wx.getStorageSync('token')
						wx.request({
							url: that.data.url + `/appointments/${that.data.item.appointmentId}/cancel`,
							method: 'PUT',
							data: {
								reason: res.content
							},
							header: {
								'Authorization': token
							},
							success: (res1) => {
								wx.hideLoading()
								if (res1.data.code == 200) {
									that.setData({
										item: res1.data.data
									})
									wx.showToast({
										title: '已取消',
									})
								} else {
									that.show(res1.data.msg)
								}
							}
						})
					} else {
						that.show("请输入取消原因")
					}
				} else if (res.cancel) {

				}
			}
		})
	},
	scanCode() {
		wx.scanCode({
			scanType: ['qrCode', 'barCode'],
			success: (res) => {
				const raw = (res.result || '').trim()
				if (!raw) {
					this.show('扫码结果为空')
					return
				}
				let key = ''
				let loc = ''
				try {
					const obj = JSON.parse(raw)
					const v = obj && obj['check-in-token']
					key = typeof v === 'string' ? v.trim() : ''
					const lv = obj && (obj['location-id'] != null ? obj['location-id'] : obj['locationId'])
					if (typeof lv === 'string') loc = lv.trim()
					else if (lv != null) loc = String(lv)
				} catch (e) {
					key = ''
					loc = ''
				}
				if (!key) {
					this.show('二维码错误')
					return
				}
				const sid = Number(loc)
				const that = this
				wx.showLoading({
					title: '请等待...',
				})
				wx.request({
					url: `${that.data.url}/appointments/${that.data.item.appointmentId}/check-in`,
					method: 'PUT',
					data: { token: key },
					header: {
						'Authorization': wx.getStorageSync('token')
					},
					success: (res1) => {
						wx.hideLoading();
						if (res1.data.code == 200) {
							that.setData({ item: res1.data.data })
							wx.showToast({ title: '成功签到' })
							if (isFinite(sid)) {
								const eid = Number(that.data.doctor && that.data.doctor.locationId)
								if (isFinite(eid)) {
									setTimeout(() => {
										wx.navigateTo({
											url: `/pages/navigation/navigation?selectedStartPointId=${sid}&selectedEndPointId=${eid}`
										})
									}, 1500)
								}
							}
						} else {
							that.show(res1.data.msg)
						}
					},
					fail: () => {
						that.show('请检查网络连接')
					}
				})
			},
			fail: () => {
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
