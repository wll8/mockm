function wrapApiData({data, code = 200}) { // 包裹 api 的返回值
  code = String(code)
  return {
    code,
    success: Boolean(code.match(/^[2]/)), // 如果状态码以2开头则为 true
    data,
  }
}

module.exports = {
  wrapApiData,
}