// app.js
import { ToastPannel } from './component/appToast/appToast'
App({
	ToastPannel,
	onLaunch() {
	},
	globalData: {
		$url: 'http://hcmu.jiasheng.wang:8080'
	},
	notPermission: () => {
		wx.showModal({
			title: '提示',
			content: '请先登录后操作',
			success(res) {
				if (res.confirm) {
					wx.redirectTo({
						url: '/pages/sign/sign'
					})
				} else if (res.cancel) {
					wx.navigateBack({
						delta: 1
					});
				}
			}
		})
	}
})
