// pages/navigation/navigation.js
const app = getApp()
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
		selectedMapName: "",
		selectedStartIndex: 0,
		selectedStartName: "",
		selectedEndIndex: 0,
		selectedEndName: "",
		showLine: false,
		paths: [],
		selectedPathIndex: 0,
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
			showLine: false
		});
		//TODO: 三次request分别获取地图,边,节点信息
		const pts = this.data.points || [];
		const roomPoints = pts.filter(p => Number(p.type) === 1);
		this.setData({ roomPoints: roomPoints });

		if (options) {// 从其他页面跳转过来时, 包含地图名称,起点名称,终点名称
			const { selectedMapName, selectedStartName, selectedEndName } = options;
			if (selectedMapName) {
				const mapsArr = this.data.maps || [];
				const mi = mapsArr.findIndex(m => m && m.mapName === selectedMapName);
				this.setData({ selectedMapName, selectedMapIndex: mi >= 0 ? mi : this.data.selectedMapIndex });
			}
			if (selectedStartName) {
				const si = roomPoints.findIndex(p => p && p.pointName === selectedStartName);
				this.setData({ selectedStartName, selectedStartIndex: si >= 0 ? si : this.data.selectedStartIndex });
			}
			if (selectedEndName) {
				const ei = roomPoints.findIndex(p => p && p.pointName === selectedEndName);
				this.setData({ selectedEndName, selectedEndIndex: ei >= 0 ? ei : this.data.selectedEndIndex });
			}
			if (selectedStartName && selectedEndName) {//包含起点与终点时自动查询路径
				this.onQuery();
			}
		}
		this.updateImageFromMap()
	},
	updateImageFromMap() {//将map中的imageBase64转为临时图像
		const maps = this.data.maps || [];
		const idx = Number(this.data.selectedMapIndex || 0);
		const m = maps[idx];
		if (!m || !m.imageBase64) return;
		const fs = wx.getFileSystemManager();
		const filePath = this.data.imagePath || `${wx.env.USER_DATA_PATH}/nav_image_${Date.now()}.png`;
		fs.writeFile({
			filePath,
			data: m.imageBase64,
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
					}
				});
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
			const rooms = this.data.roomPoints || [];
			const s = this.data.displayScale || (w && this.data.imageNaturalWidth ? w / this.data.imageNaturalWidth : 1);
			ctx.setFillStyle('#000000');
			ctx.setTextAlign('center');
			ctx.setTextBaseline('middle');
			ctx.setFontSize(Math.max(12, Math.round(14 * s)));
			for (let i = 0; i < rooms.length; i++) {
				const p = rooms[i];
				const name = p.pointName || String(p.pointId);
				const x = Math.round(p.x * s);
				const y = Math.round(p.y * s);
				ctx.fillText(name, x, y);
			}
			ctx.draw();
		},
	onCanvasTap() {//预览当前地图
		if (!this.data.imagePath) return;
		wx.canvasToTempFilePath({
			canvasId: 'navCanvas',
			destWidth: this.data.imageNaturalWidth || this.data.canvasWidth,
			destHeight: this.data.imageNaturalHeight || this.data.canvasHeight,
			quality: 1,
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
		if (a.type === 2 && b.type === 2) return 1;
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
		if (s.type !== 1 || t.type !== 1) return [];
		if (String(startPointId) === String(endPointId)) {
			this.setData({ paths: [] });
			return [];
		}
		const { graph } = this._buildGraph(points, edges);
		const { prevNode, prevEdge } = this._dijkstra(graph, String(startPointId), String(endPointId));
		const pathEdges = this._reconstructPath(prevNode, prevEdge, String(startPointId), String(endPointId));
		const segmented = [];
		let level = [];
		for (let i = 0; i < pathEdges.length; i++) {
			const e = pathEdges[i];
			const a = pointsMap.get(e.fromPointId);
			const b = pointsMap.get(e.toPointId);
			const isTeleport = a && b && a.type === 2 && b.type === 2;
			if (isTeleport) {
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
		this.setData({ selectedStartIndex: e.detail.value });
	},
	bindEndChange(e) {//界面修改终点下拉框绑定函数
		this.setData({ selectedEndIndex: e.detail.value });
	},
	onQuery() {//查询按钮绑定函数
		if (this.data.showLine) {
			this.setData({ showLine: false });
			this.drawImage();
			return;
		}
		const rooms = this.data.roomPoints || [];
		const sIdx = Number(this.data.selectedStartIndex || 0);
		const eIdx = Number(this.data.selectedEndIndex || 0);
		const s = rooms[sIdx];
		const t = rooms[eIdx];
		if (!s || !t) {
			this.setData({ showLine: false, paths: [], selectedPathIndex: 0 });
			this.drawImage();
			return;
		}
		const segments = this.computeShortestPath(s.pointId, t.pointId) || [];
		const has = Array.isArray(segments) && segments.length > 0;
		this.setData({ showLine: has, selectedPathIndex: 0 });
		if (has) {
			const points = this.data.points || [];
			const pointsMap = new Map(points.map(p => [p.pointId, p]));
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
