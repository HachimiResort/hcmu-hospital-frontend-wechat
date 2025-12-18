// pages/navigation/navigation.js
const app = getApp()
const BEACON_UUID = '38cb4c33-0587-49de-8c0e-a0370261f321'
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		url: getApp().globalData.$url,
		// 地图信息数组，包含所有地图数据
		// 结构: [{mapId: 0, imageBase64: '', mapName: ''}]
		maps: [],


		// 节点信息数组，包含所有路径节点数据
		// 结构: [{pointId: 0, mapId: 0, x: 0, y: 0, type: 0, pointName: ''}]
		// 节点类型: 0-路径节点(仅中间点), 1-房间节点(起终点), 2-传送节点(跨地图)
		points: [],


		// 端点信息数组,包含所有type=1的路径节点.
		// 结构: [{pointId: 0, mapId: 0, x: 0, y: 0, type: 0, pointName: ''}]
		// 节点类型: 1-房间节点(起终点)
		roomPoints: [],


		// 边信息数组，包含所有连接边数据
		// 结构: [{edgeId: 0, fromPointId: 0, toPointId: 0}]
		edges: [],

		gotmaps: false,
		selectedMapIndex: 0,
		selectedMapId: 0,
		selectedStartIndex: 0,
		selectedStartPointId: 0,
		selectedEndIndex: 0,
		selectedEndPointId: 0,
		showLine: false,
		showStartPoint: false,
		paths: [],
		selectedPathIndex: 0,
		orderList: [],
		doctor: {},
		showOrderPicker: false
	},
	openOrderPicker() {
		if (!this.data.gotmaps || this.data.showLine) return;
		this.setData({ showOrderPicker: true });
	},
	closeOrderPicker() {
		this.setData({ showOrderPicker: false });
		this.drawImage();
	},
	onChooseOrder(e) {
		const idx = Number(e.currentTarget.dataset.index || 0);
		const list = this.data.orderList || [];
		const item = list[idx];
		if (!item) { this.setData({ showOrderPicker: false }); return; }
		const token = wx.getStorageSync('token');
		wx.showLoading({ title: '请等待...', mask: true });
		wx.request({
			url: this.data.url + `/doctor-profiles/` + item.doctorUserId,
			header: { 'Authorization': token },
			method: 'GET',
			success: (res) => {
				wx.hideLoading();
				if (res.data && res.data.code == 200) {
					const doctor = res.data.data || {};
					this.setData({ doctor });
					const endId = Number(doctor.locationId);
					if (!isFinite(endId)) {
						wx.showToast({ title: '未获取到医生位置', icon: 'none' });
						this.setData({ showOrderPicker: false });
						return;
					}
					const rooms = this.data.roomPoints || [];
					const ei = rooms.findIndex(p => p && Number(p.pointId) === endId);
					this.setData({ selectedEndPointId: endId, selectedEndIndex: ei >= 0 ? ei : -1, showOrderPicker: false });
					wx.showToast({ title: '已更新终点', icon: 'none' });
				} else {
					wx.showToast({ title: (res && res.data ? res.data.msg : '获取医生信息失败'), icon: 'none' });
				}
			},
			fail: () => {
				wx.hideLoading();
				wx.showToast({ title: '请检查网络连接', icon: 'none' });
			}
		});
		this.drawImage();
	},
	drawDot(ctx, ox, oy) {
		const s = this.data.displayScale || ((this.data.canvasWidth && this.data.imageNaturalWidth) ? this.data.canvasWidth / this.data.imageNaturalWidth : 1);
		const x = Math.round(ox * s);
		const y = Math.round(oy * s);
		const r = Math.max(6, Math.round(2 * s));
		ctx.beginPath();
		ctx.setFillStyle('#66ccff');
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
		const L = Math.max(30, Math.round(16 * s));
		const tipX = x - r - 1;
		const tipY = y;
		ctx.beginPath();
		ctx.setStrokeStyle('#ff0000');
		ctx.setLineWidth(2);
		ctx.moveTo(x - L, y);
		ctx.lineTo(tipX, tipY);
		ctx.stroke();
		const back = Math.PI;
		const a1 = back + Math.PI / 6;
		const a2 = back - Math.PI / 6;
		const len = Math.max(6, Math.round(10 * s));
		ctx.beginPath();
		ctx.moveTo(tipX, tipY);
		ctx.lineTo(tipX + len * Math.cos(a1), tipY + len * Math.sin(a1));
		ctx.moveTo(tipX, tipY);
		ctx.lineTo(tipX + len * Math.cos(a2), tipY + len * Math.sin(a2));
		ctx.stroke();
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		new app.ToastPannel();
		this.setData({
			gotmaps: false,
			selectedMapIndex: 0,
			selectedStartIndex: 0,
			selectedEndIndex: 0,
			showLine: false,
			showStartPoint: false
		});
		wx.showLoading({ title: '加载中', mask: true });
		const baseUrl = this.data.url;
		const token = wx.getStorageSync('token');
		wx.request({
			url: baseUrl + `/patient-profiles/${wx.getStorageSync('userId')}/appointments`,
			header: {
				'Authorization': token
			},
			success: (res) => {
				if (res.data.code == 200) {
					this.setData({
						orderList:  res.data.data.list,
					});
				} else {
					wx.showToast({ title: res.data.msg, icon: 'none' })
				}
			}
		})
		const httpGet = (path) => new Promise((resolve, reject) => {
			wx.request({
				url: baseUrl + path,
				method: 'GET',
				header: { Authorization: token },
				success: res => resolve(res),
				fail: err => reject(err)
			});
		});
		Promise.all([
			httpGet('/maps'),
			httpGet('/maps/edges'),
			httpGet('/maps/points')
		]).then(([mapsRes, edgesRes, pointsRes]) => {
			const maps = (mapsRes && mapsRes.data && mapsRes.data.data) || [];
			const edges = (edgesRes && edgesRes.data && edgesRes.data.data) || [];
			const points = (pointsRes && pointsRes.data && pointsRes.data.data) || [];
			if (Array.isArray(maps) && Array.isArray(edges) && Array.isArray(points)) {
				const roomPoints = points.filter(p => Number(p.type) === 1);
				const defaultStartId = roomPoints[0] ? roomPoints[0].pointId : 0;
				this.setData({ maps, edges, points, roomPoints, gotmaps: true, selectedStartPointId: defaultStartId, selectedEndPointId: defaultStartId });
				if (options) {
					const { selectedMapId, selectedStartPointId, selectedEndPointId } = options;
					if (selectedMapId) {
						const mi = maps.findIndex(m => m && m.mapId === Number(selectedMapId));
						this.setData({ selectedMapId: Number(selectedMapId), selectedMapIndex: mi >= 0 ? mi : this.data.selectedMapIndex });
					}
					if (selectedStartPointId) {
						const sidNum = Number(selectedStartPointId);
						const si = roomPoints.findIndex(p => p && p.pointId === sidNum);
						this.setData({ selectedStartPointId: sidNum, selectedStartIndex: si >= 0 ? si : -1 });
					}
					if (selectedEndPointId) {
						const tidNum = Number(selectedEndPointId);
						const ei = roomPoints.findIndex(p => p && p.pointId === tidNum);
						this.setData({ selectedEndPointId: tidNum, selectedEndIndex: ei >= 0 ? ei : -1 });
					}
					if (selectedStartPointId && selectedEndPointId) {
						console.log(this.data.points);
						this.onQuery();
					}
				}
				wx.hideLoading();

				this.updateImageFromMap();
			} else {
				wx.hideLoading();
				this.setData({ gotmaps: false });
			}
		}).catch(() => {
			wx.hideLoading();
			this.setData({ gotmaps: false });
		});
	},
	updateImageFromMap() {//将map中的imageBase64转为临时图像
		const maps = this.data.maps || [];
		const idx = Number(this.data.selectedMapIndex || 0);
		const m = maps[idx];
		if (!m || !m.imageBase64) return;
		const fs = wx.getFileSystemManager();
		let raw = String(m.imageBase64 || '');
		let ext = 'png';
		const match = raw.match(/^data:image\/(png|jpeg|jpg);base64,/i);
		if (match) {
			const fmt = match[1].toLowerCase();
			ext = fmt === 'jpeg' ? 'jpg' : fmt;
			raw = raw.replace(/^data:image\/(png|jpeg|jpg);base64,/i, '');
		}
		const filePath = `${wx.env.USER_DATA_PATH}/nav_image_${Date.now()}.${ext}`;
		fs.writeFile({
			filePath,
			data: raw,
			encoding: 'base64',
			success: () => {
				wx.getImageInfo({
					src: filePath,
					success: res => {
						this.setData({
							imagePath: filePath,
							imageNaturalWidth: res.width,
							imageNaturalHeight: res.height,
							canvasWidth: res.width,
							canvasHeight: res.height
						});
						this.fitToScreen();
					},
					fail: () => {
						const dataUrl = `data:image/${ext};base64,${raw}`;
						wx.getImageInfo({
							src: dataUrl,
							success: res => {
								this.setData({
									imagePath: filePath,
									imageNaturalWidth: res.width,
									imageNaturalHeight: res.height,
									canvasWidth: res.width,
									canvasHeight: res.height
								});
								this.fitToScreen();
							},
							fail: () => {
								this.setData({ imagePath: '', canvasWidth: 0, canvasHeight: 0 });
							}
						});
					}
				});
			},
			fail: () => {
				this.setData({ imagePath: '', canvasWidth: 0, canvasHeight: 0 });
			}
		});
	},
	updateMapForCurrentPath() {//根据当前路径更新地图
		const paths = this.data.paths || [];
		const idx = Number(this.data.selectedPathIndex || 0);
		const segment = paths[idx];
		const points = this.data.points || [];
		const pointsMap = new Map(points.map(p => [p.pointId, p]));
		let targetMapId;
		if (segment && segment.length) {
			const e0 = segment[0];
			const pa = pointsMap.get(e0.fromPointId);
			const pb = pointsMap.get(e0.toPointId);
			targetMapId = pa && pb ? pa.mapId : (pa ? pa.mapId : (pb ? pb.mapId : undefined));
		}
		const maps = this.data.maps || [];
		const mi = maps.findIndex(m => m && m.mapId === targetMapId);
		if (mi >= 0 && mi !== this.data.selectedMapIndex) {
			this.setData({ selectedMapIndex: mi });
		}
		this.updateImageFromMap();
	},
	drawLineSegment(ctx, ox1, oy1, ox2, oy2) {//绘制路径线段(包括箭头)
		const s = this.data.displayScale || ((this.data.canvasWidth && this.data.imageNaturalWidth) ? this.data.canvasWidth / this.data.imageNaturalWidth : 1);
		const x1 = Math.round(ox1 * s);
		const y1 = Math.round(oy1 * s);
		const x2 = Math.round(ox2 * s);
		const y2 = Math.round(oy2 * s);
		const lw = 2;
		ctx.beginPath();
		ctx.setStrokeStyle('#ff0000');
		ctx.setLineWidth(lw);
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		const r = lw / 2;
		ctx.beginPath();
		ctx.setFillStyle('#ff0000');
		ctx.arc(x1, y1, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(x2, y2, r, 0, Math.PI * 2);
		ctx.fill();
		const angle = Math.atan2(y2 - y1, x2 - x1);
		const len = Math.max(6, Math.round(10 * s));
		const origLen = Math.hypot(ox2 - ox1, oy2 - oy1);
		if (origLen < 100) {
			const mx = Math.round((x1 + x2) / 2);
			const my = Math.round((y1 + y2) / 2);
			const back = angle + Math.PI;
			const a1 = back + Math.PI / 6;
			const a2 = back - Math.PI / 6;
			ctx.beginPath();
			ctx.moveTo(mx, my);
			ctx.lineTo(mx + len * Math.cos(a1), my + len * Math.sin(a1));
			ctx.moveTo(mx, my);
			ctx.lineTo(mx + len * Math.cos(a2), my + len * Math.sin(a2));
			ctx.stroke();
		} else {
			const bx1 = x1 + (x2 - x1) / 3;
			const by1 = y1 + (y2 - y1) / 3;
			const back = angle + Math.PI;
			const a1 = back + Math.PI / 6;
			const a2 = back - Math.PI / 6;
			ctx.beginPath();
			ctx.moveTo(bx1, by1);
			ctx.lineTo(bx1 + len * Math.cos(a1), by1 + len * Math.sin(a1));
			ctx.moveTo(bx1, by1);
			ctx.lineTo(bx1 + len * Math.cos(a2), by1 + len * Math.sin(a2));
			ctx.stroke();
			const bx2 = x1 + (x2 - x1) * 2 / 3;
			const by2 = y1 + (y2 - y1) * 2 / 3;
			ctx.beginPath();
			ctx.moveTo(bx2, by2);
			ctx.lineTo(bx2 + len * Math.cos(a1), by2 + len * Math.sin(a1));
			ctx.moveTo(bx2, by2);
			ctx.lineTo(bx2 + len * Math.cos(a2), by2 + len * Math.sin(a2));
			ctx.stroke();
		}

	},
	drawPath(ctx) {//绘制当前地图的完整路径
		const paths = this.data.paths || [];
		const idx = this.data.selectedPathIndex || 0;
		const segment = paths[idx];
		if (!segment || !segment.length) return;
		const points = this.data.points || [];
		const pointsMap = new Map(points.map(p => [p.pointId, p]));
		for (let i = 0; i < segment.length; i++) {
			const e = segment[i];
			const a = pointsMap.get(e.fromPointId);
			const b = pointsMap.get(e.toPointId);
			if (!a || !b) continue;
			this.drawLineSegment(ctx, a.x, a.y, b.x, b.y);
		}
	},
	drawImage() {

		if (!this.data.imagePath) return;
		const w = this.data.canvasWidth || this.data.imageNaturalWidth || 0;
		const h = this.data.canvasHeight || this.data.imageNaturalHeight || 0;
		const ctx = wx.createCanvasContext('navCanvas', this);
		ctx.clearRect(0, 0, w, h);
		ctx.drawImage(this.data.imagePath, 0, 0, w, h);
		if (this.data.showLine) {
			this.drawPath(ctx);
		}
		const mapsArr = this.data.maps || [];
		const mi = Number(this.data.selectedMapIndex || 0);
		const curMapId = mapsArr[mi] ? mapsArr[mi].mapId : this.data.selectedMapId;
		if (this.data.showStartPoint) {
			const pts = this.data.points || [];
			const pmap = new Map(pts.map(p => [p.pointId, p]));
			const sid = Number(this.data.selectedStartPointId || 0);
			const startPoint = pmap.get(sid);
			if (startPoint && startPoint.mapId === curMapId) {
				this.drawDot(ctx, startPoint.x, startPoint.y);
			}
		}
		const rooms = (this.data.roomPoints || []).filter(p => p.mapId === curMapId);
		const s = this.data.displayScale || (w && this.data.imageNaturalWidth ? w / this.data.imageNaturalWidth : 1);
		ctx.setFillStyle('#000000');
		ctx.setTextAlign('center');
		ctx.setTextBaseline('middle');
		const fontSize = Math.max(7, Math.round(14 * s));
		ctx.setFontSize(fontSize);
		const lineHeight = fontSize + Math.round(2 * s);
		for (let i = 0; i < rooms.length; i++) {
			const p = rooms[i];
			const name = p.pointName || String(p.pointId);
			const x = Math.round(p.x * s);
			const y = Math.round(p.y * s);
			const chars = Array.from(name);
			const lines = [];
			for (let k = 0; k < chars.length; k += 3) {
				lines.push(chars.slice(k, k + 3).join(''));
			}
			const offsetBase = (lines.length - 1) / 2;
			for (let j = 0; j < lines.length; j++) {
				const ly = y + Math.round((j - offsetBase) * lineHeight);
				ctx.fillText(lines[j], x, ly);
			}
		}

		ctx.draw();
	},
	onCanvasTap() {//预览当前地图
		if (!this.data.imagePath) return;
		wx.canvasToTempFilePath({
			canvasId: 'navCanvas',
			success: res => {
				wx.previewImage({ urls: [res.tempFilePath], current: res.tempFilePath });
			}
		}, this);
	},
	measureTopbar(cb) {//测量可用长度
		const q = wx.createSelectorQuery();
		q.select('#topbar').boundingClientRect(rect => {
			this.setData({ topbarHeight: (rect && rect.height) ? rect.height : 0 });
		}).exec(() => { if (cb) cb(); });
	},
	fitToScreen() {//根据可用长度调整画布大小
		//console.log(this.data.imagePath);
		if (!this.data.imageNaturalWidth || !this.data.imageNaturalHeight) return;
		const sys = wx.getSystemInfoSync();
		const topH = this.data.topbarHeight || 0;
		const availW = sys.windowWidth;
		const availH = Math.max(0, sys.windowHeight - topH);
		const scale = Math.min(availW / this.data.imageNaturalWidth, availH / this.data.imageNaturalHeight);
		const w = Math.floor(this.data.imageNaturalWidth * scale);
		const h = Math.floor(this.data.imageNaturalHeight * scale);
		this.setData({ canvasWidth: w, canvasHeight: h, displayScale: scale });

		this.drawImage();
	},

	_weightOfEdge(edge, pointsMap) {//计算边的权重(距离)
		const a = pointsMap.get(edge.fromPointId);
		const b = pointsMap.get(edge.toPointId);
		if (!a || !b) return Infinity;
		if (a.type === 2 && b.type === 2 && a.mapId !== b.mapId) return 1;
		if (a.mapId !== b.mapId) return Infinity;
		const dx = a.x - b.x;
		const dy = a.y - b.y;
		return Math.sqrt(dx * dx + dy * dy);
	},

	_buildGraph(points, edges) {//建图
		const pointsMap = new Map();
		points.forEach(p => pointsMap.set(p.pointId, p));
		const graph = {};
		points.forEach(p => { graph[String(p.pointId)] = []; });
		edges.forEach(e => {
			const w = this._weightOfEdge(e, pointsMap);
			if (!isFinite(w)) return;
			const eid = e.edgeId != null ? e.edgeId : `${Math.min(e.fromPointId, e.toPointId)}-${Math.max(e.fromPointId, e.toPointId)}`;
			const fromKey = String(e.fromPointId);
			const toKey = String(e.toPointId);
			if (graph[fromKey]) graph[fromKey].push({ to: toKey, edgeId: eid, weight: w });
			if (graph[toKey]) graph[toKey].push({ to: fromKey, edgeId: eid, weight: w });
		});
		return { graph, pointsMap };
	},

	_dijkstra(graph, startId, endId) {//最短路算法
		const dist = {};
		const prevNode = {};
		const prevEdge = {};
		Object.keys(graph).forEach(id => { dist[id] = Infinity; prevNode[id] = null; prevEdge[id] = null; });
		dist[startId] = 0;
		const pq = [{ id: startId, d: 0 }];
		const visited = new Set();
		while (pq.length) {
			pq.sort((a, b) => a.d - b.d);
			const cur = pq.shift();
			const u = cur.id;
			if (visited.has(u)) continue;
			visited.add(u);
			if (u === endId) break;
			const adj = graph[u] || [];
			for (let i = 0; i < adj.length; i++) {
				const { to, edgeId, weight } = adj[i];
				if (visited.has(to)) continue;
				const alt = dist[u] + weight;
				if (alt < dist[to]) {
					dist[to] = alt;
					prevNode[to] = u;
					prevEdge[to] = edgeId;
					pq.push({ id: to, d: alt });
				}
			}
		}
		return { prevNode, prevEdge, dist };
	},

	_reconstructPath(prevNode, prevEdge, startId, endId) {//根据前驱信息重构路径
		const path = [];
		let cur = endId;
		if (prevNode[cur] === null && cur !== startId) return [];
		while (cur !== startId) {
			const p = prevNode[cur];
			const eId = prevEdge[cur];
			if (p === null) return [];
			path.unshift({ edgeId: eId, fromPointId: Number(p), toPointId: Number(cur) });
			cur = p;
		}
		return path;
	},

	computeShortestPath(startPointId, endPointId) {//计算最短路径并修改path
		const points = this.data.points || [];
		const edges = this.data.edges || [];
		const pointsMap = new Map(points.map(p => [p.pointId, p]));
		const s = pointsMap.get(startPointId);
		const t = pointsMap.get(endPointId);
		if (!s || !t) return [];
		if (String(startPointId) === String(endPointId)) {
			this.setData({ paths: [] });
			return [];
		}
		const { graph } = this._buildGraph(points, edges);
		const { prevNode, prevEdge } = this._dijkstra(graph, String(startPointId), String(endPointId));
		const pathEdges = this._reconstructPath(prevNode, prevEdge, String(startPointId), String(endPointId));
		console.log(pathEdges);
		const segmented = [];
		let level = [];
		for (let i = 0; i < pathEdges.length; i++) {
			const e = pathEdges[i];
			const a = pointsMap.get(e.fromPointId);
			const b = pointsMap.get(e.toPointId);
			const isTeleport = a && b && a.type === 2 && b.type === 2 && a.mapId !== b.mapId;
			if (isTeleport) {
				console.log(e);
				if (level.length > 0) {
					segmented.push(level);
					level = [];
				}
			} else {
				level.push(e);
			}
		}
		if (level.length > 0) segmented.push(level);
		this.setData({ paths: segmented });
		return segmented;
	},
	bindMapChange(e) {//界面修改地图下拉框绑定函数
		this.setData({ selectedMapIndex: e.detail.value });
		this.updateImageFromMap();
	},
	bindStartChange(e) {//界面修改起点下拉框绑定函数
		const idx = Number(e.detail.value || 0);
		const rooms = this.data.roomPoints || [];
		const pid = rooms[idx] ? rooms[idx].pointId : 0;
		this.setData({ showStartPoint: false, selectedStartIndex: idx, selectedStartPointId: pid });
		this.drawImage();
	},
	bindEndChange(e) {//界面修改终点下拉框绑定函数
		const idx = Number(e.detail.value || 0);
		const rooms = this.data.roomPoints || [];
		const pid = rooms[idx] ? rooms[idx].pointId : 0;
		this.setData({ selectedEndIndex: idx, selectedEndPointId: pid });
	},
	onQuery() {//查询按钮绑定函数
		if (this.data.showLine) {
			this.setData({ showLine: false });
			this.drawImage();
			return;
		}
		const sid = Number(this.data.selectedStartPointId || 0);
		const tid = Number(this.data.selectedEndPointId || 0);
		const points = this.data.points || [];
		const pointsMap = new Map(points.map(p => [p.pointId, p]));
		const s = pointsMap.get(sid);
		const t = pointsMap.get(tid);
		if (!s || !t) {
			this.setData({ showLine: false, paths: [], selectedPathIndex: 0 });
			this.setData({ showStartPoint: false });
			this.drawImage();
			return;
		}

		const segments = this.computeShortestPath(sid, tid) || [];
		const has = Array.isArray(segments) && segments.length > 0;
		this.setData({ showLine: has, selectedPathIndex: 0 });
		this.setData({ showStartPoint: false });
		console.log(segments);
		if (has) {
			const seg = segments[0];
			let targetMapId;
			if (seg && seg.length) {
				const e0 = seg[0];
				const pa = pointsMap.get(e0.fromPointId);
				const pb = pointsMap.get(e0.toPointId);
				targetMapId = pa && pb ? pa.mapId : undefined;
			}
			if (targetMapId === undefined && s) targetMapId = s.mapId;
			const maps = this.data.maps || [];
			const mi = maps.findIndex(m => m && m.mapId === targetMapId);
			if (mi >= 0 && mi !== this.data.selectedMapIndex) {
				this.setData({ selectedMapIndex: mi });
			}
			this.updateImageFromMap();
		} else {
			this.drawImage();
		}
	},
	onPrevPath() {//上一页按钮绑定函数
		let idx = Number(this.data.selectedPathIndex || 0);
		if (idx > 0) {
			idx -= 1;
			this.setData({ selectedPathIndex: idx });
			this.updateMapForCurrentPath();
		}
	},
	onNextPath() {//下一页按钮绑定函数
		const paths = this.data.paths || [];
		const max = Math.max(0, paths.length - 1);
		let idx = Number(this.data.selectedPathIndex || 0);
		if (idx < max) {
			idx += 1;
			this.setData({ selectedPathIndex: idx });
			this.updateMapForCurrentPath();
		}
	},
	onScanLocation() {
		wx.scanCode({
			scanType: ['qrCode', 'barCode'],
			success: (res) => {
				const raw = (res.result || '').trim();
				if (!raw) { wx.showToast({ title: '扫码结果为空', icon: 'none' }); return; }
				let key = '';
				try {
					const obj = JSON.parse(raw);
					const v = obj && (obj['location-id'] != null ? obj['location-id'] : obj['locationId']);
					if (typeof v === 'string') key = v.trim();
					else if (v != null) key = String(v);
				} catch (e) { key = ''; }
				const sid = Number(key);
				if (!isFinite(sid)) { wx.showToast({ title: '二维码错误', icon: 'none' }); return; }
				const rooms = this.data.roomPoints || [];
				const si = rooms.findIndex(p => p && Number(p.pointId) === sid);
				this.setData({ selectedStartPointId: sid, selectedStartIndex: si >= 0 ? si : -1 });
				const points = this.data.points || [];
				const maps = this.data.maps || [];
				const pmap = new Map(points.map(p => [p.pointId, p]));
				const sp = pmap.get(sid);
				if (sp) {
					const mi = maps.findIndex(m => m && m.mapId === sp.mapId);
					if (mi >= 0 && mi !== this.data.selectedMapIndex) {
						this.setData({ selectedMapIndex: mi, showStartPoint: true, showLine: false });
						this.updateImageFromMap();
						wx.showToast({ title: '当前位置已显示在地图上', icon: 'none' });
						return;
					}
				}
				this.setData({ showStartPoint: true, showLine: false });
				wx.showToast({ title: '当前位置已显示在地图上', icon: 'none' });
				this.drawImage();

			},
			fail: () => { }
		});
	},
	onBluetoothLocation() {
		if (!this.data.gotmaps || this.data.showLine) return;
		const that = this;
		let completed = false;
		let timer = null;
		const finish = (sid) => {
			if (completed) return;
			completed = true;
			try { if (wx.offBeaconUpdate) wx.offBeaconUpdate(); } catch (e) {}
			try { wx.stopBeaconDiscovery({}); } catch (e) {}
			try { if (timer) clearTimeout(timer); } catch (e) {}
			wx.hideLoading();
			if (!isFinite(sid)) { wx.showToast({ title: '蓝牙信标数据错误', icon: 'none' }); return; }
			const rooms = this.data.roomPoints || [];
			const si = rooms.findIndex(p => p && Number(p.pointId) === sid);
			this.setData({ selectedStartPointId: sid, selectedStartIndex: si >= 0 ? si : -1 });
			const points = this.data.points || [];
			const maps = this.data.maps || [];
			const pmap = new Map(points.map(p => [p.pointId, p]));
			const sp = pmap.get(sid);
			if (sp) {
				const mi = maps.findIndex(m => m && m.mapId === sp.mapId);
				if (mi >= 0 && mi !== this.data.selectedMapIndex) {
					this.setData({ selectedMapIndex: mi, showStartPoint: true, showLine: false });
					this.updateImageFromMap();
					wx.showToast({ title: '当前位置已显示在地图上', icon: 'none' });
					return;
				}
			}
			this.setData({ showStartPoint: true, showLine: false });
			wx.showToast({ title: '当前位置已显示在地图上', icon: 'none' });
			this.drawImage();
		};
		wx.showLoading({ title: '正在搜索附近蓝牙信标...', mask: true });
		wx.startBeaconDiscovery({
			uuids: [BEACON_UUID],
			success: () => {
				timer = setTimeout(() => {
					if (completed) return;
					completed = true;
					try { if (wx.offBeaconUpdate) wx.offBeaconUpdate(); } catch (e) {}
					try { wx.stopBeaconDiscovery({}); } catch (e) {}
					wx.hideLoading();
					wx.showToast({ title: '附近未发现蓝牙信标', icon: 'none' });
				}, 10000);
				wx.onBeaconUpdate((res) => {
					if (completed) return;
					const list = Array.isArray(res && res.beacons) ? res.beacons : [];
					if (!list.length) return;
					let nearest = null;
					for (let i = 0; i < list.length; i++) {
						const b = list[i];
						if (!nearest) { nearest = b; continue; }
						const a2 = Number(b.accuracy);
						const a1 = Number(nearest.accuracy);
						const v2 = isFinite(a2) && a2 >= 0;
						const v1 = isFinite(a1) && a1 >= 0;
						if (v2 && v1) {
							if (a2 < a1) nearest = b;
						} else if (v2 && !v1) {
							nearest = b;
						} else if (!v2 && !v1) {
							const r2 = Number(b.rssi);
							const r1 = Number(nearest.rssi);
							if (isFinite(r2) && isFinite(r1)) {
								if (r2 > r1) nearest = b;
							}
						}
					}
					const sid = Number(nearest && nearest.major);
					if (!isFinite(sid)) return;
					if (timer) { try { clearTimeout(timer); } catch (e) {} timer = null; }
					finish(sid);
				});
			},
			fail: () => {
				wx.hideLoading();
				wx.showToast({ title: '蓝牙导航不可用，请检查蓝牙和定位权限', icon: 'none' });
			}
		});
	},
	uigo(id) {//可能已废弃
	},
	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {
		this.measureTopbar(() => {
			this.fitToScreen();
		});
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
	onUnload() {//清除临时图片
		if (this.data.imagePath) {
			const fs = wx.getFileSystemManager();
			fs.unlink({
				filePath: this.data.imagePath,
				fail: () => { }
			});
		}
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
