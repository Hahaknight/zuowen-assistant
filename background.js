// 作文批改助手 - Background Script
// 负责处理跨域请求等后台任务

// 目前主要逻辑在 popup.js 中直接调用 API
// background.js 预留用于处理更复杂的后台任务

chrome.runtime.onInstalled.addListener(() => {
  console.log('作文批改助手已安装');
});
