const app = getApp()

Page({
  data: {
    url: getApp().globalData.$url,
    messages: [],
    inputText: '',
    sending: false,
    lastId: ''
  },
  onLoad() {
    new app.ToastPannel()
    const welcome = "您好！我是基米医生，一个专业的医疗助手。我的主要职责是帮助您解答医疗相关问题，尤其是根据您的症状进行初步的预诊，并推荐您前往最合适的医院科室就诊。\n\n当您向我描述症状时，我会根据我的专业知识，分析您可能的情况，并向您解释为什么推荐某个科室，以及可能涉及的疾病类型。如果您的描述不够明确，我还会主动向您提问，以获取更详细的信息，从而给出更准确的建议。\n\n我的目标是为您提供及时、准确的医疗指导，帮助您高效就医。请您随时向我描述您的不适，我会尽力为您提供帮助！"
    const id = 'm_' + Date.now() + '_welcome'
    const r = this.computeRender(welcome)
    const list = this.data.messages.concat({ id, role: 'assistant', content: welcome, mdNodes: r.mdNodes, html: r.html })
    this.setData({ messages: list, lastId: id })
  },
  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },
  onSend() {
    const text = (this.data.inputText || '').trim()
    if (!text) return
    const id = 'm_' + Date.now()
    const msg = { id, role: 'user', content: text }
    const list = this.data.messages.concat(msg)
    this.setData({ messages: list, inputText: '', lastId: id })
    this.startChat(text)
  },
  startChat(prompt) {
    const history = this.toOpenAIHistory(this.data.messages)
    const assistId = 'm_' + Date.now() + '_a'
    this.setData({ sending: true })
    wx.showLoading({ title: '基米思考中...' })
    const data = { 
      model: 'deepseek-chat', 
      stream: false, 
      messages: history.concat([{ role: 'user', content: prompt }]) }
    let token = wx.getStorageSync('token')
    wx.request({
      url: this.data.url + '/doctor-assistant/v1/chat/completions',
      method: 'POST',
      header: {
        Authorization: token,
        'Content-Type': 'application/json'
      },
      data,
      success: (res) => {
        wx.hideLoading()
        let obj = res && res.data ? res.data : {}
        if (typeof obj === 'string') {
          try { obj = JSON.parse(obj) } catch (e) { obj = {} }
        }
        let txt = ''
        try {
          txt = obj && obj.choices && obj.choices[0] && obj.choices[0].message && obj.choices[0].message.content || ''
        } catch (e) { txt = '' }
        const r = this.computeRender(txt)
        const list = this.data.messages.concat({ id: assistId, role: 'assistant', content: txt, mdNodes: r.mdNodes, html: r.html })
        this.setData({ messages: list, lastId: assistId })
      },
      fail: () => { wx.hideLoading(); this.show('网络异常') },
      complete: () => this.setData({ sending: false })
    })
  },
  appendAssistantDelta(assistId, delta) {
    const list = this.data.messages.map(m => {
      if (m.id === assistId) {
        const content = (m.content || '') + delta
        const r = this.computeRender(content)
        return { ...m, content, mdNodes: r.mdNodes, html: r.html }
      }
      return m
    })
    this.setData({ messages: list, lastId: assistId })
  },
  toOpenAIHistory(list) {
    const out = []
    for (let i = 0; i < list.length; i++) {
      const m = list[i]
      if (m.role === 'user' || m.role === 'assistant') out.push({ role: m.role, content: m.content })
    }
    return out.slice(-10)
  },
  computeRender(text) {
    let mdNodes = null
    let html = ''
    try {
      if (app && app.towxml) mdNodes = app.towxml(text, 'markdown', { theme: 'light' })
      else html = this.mdToHtml(text)
    } catch (e) {
      html = this.mdToHtml(text)
    }
    return { mdNodes, html }
  },
  mdToHtml(s) {
    let t = s || ''
    t = t.replace(/\r\n|\r/g, '\n')
    t = t.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
    t = t.replace(/^######\s?(.*)$/gm, '<h6>$1</h6>')
    t = t.replace(/^#####\s?(.*)$/gm, '<h5>$1</h5>')
    t = t.replace(/^####\s?(.*)$/gm, '<h4>$1</h4>')
    t = t.replace(/^###\s?(.*)$/gm, '<h3>$1</h3>')
    t = t.replace(/^##\s?(.*)$/gm, '<h2>$1</h2>')
    t = t.replace(/^#\s?(.*)$/gm, '<h1>$1</h1>')
    t = t.replace(/\n/g, '<br/>')
    return t
  }
})
