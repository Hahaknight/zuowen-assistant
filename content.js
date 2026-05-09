// 作文批改助手 - Content Script
// 负责从目标网站提取作文内容和自动点击分数按钮

// 等待用户配置 DOM 选择器
let essaySelector = null;
let scoreButtonSelector = null;

// 监听 popup 发送的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractEssay') {
    try {
      const content = extractEssayContent();
      sendResponse({ success: true, content });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  } else if (message.action === 'clickScore') {
    try {
      clickScoreButton(message.score);
      sendResponse({ success: true });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  } else if (message.action === 'configureSelectors') {
    // 用户配置选择器
    essaySelector = message.essaySelector;
    scoreButtonSelector = message.scoreButtonSelector;
    sendResponse({ success: true });
  }
  return true;
});

// 提取作文内容
function extractEssayContent() {
  // 如果用户已配置选择器，使用用户配置
  if (essaySelector) {
    const element = document.querySelector(essaySelector);
    if (element) {
      return element.innerText || element.textContent;
    }
    throw new Error('未找到作文内容元素，请检查选择器');
  }

  // TODO: 在用户未配置前，使用默认策略尝试提取
  // 这需要用户后续提供 DOM 信息后才能完善

  // 常见的作文内容区域选择器模式
  const commonSelectors = [
    '[class*="essay"]',
    '[class*="content"]',
    '[class*="article"]',
    '[class*="writing"]',
    '[class*="composition"]',
    '[id*="essay"]',
    '[id*="content"]',
    '[id*="article"]',
    '.main-content',
    '.content-body',
    '#main',
    '#content'
  ];

  for (const selector of commonSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.innerText || element.textContent;
        // 简单判断是否像作文内容（有一定长度）
        if (text && text.length > 100) {
          return text.trim();
        }
      }
    } catch (e) {
      // 忽略无效选择器
    }
  }

  throw new Error('请先配置作文区域选择器（扩展将提示您）');
}

// 点击分数按钮
function clickScoreButton(score) {
  if (!scoreButtonSelector) {
    throw new Error('请先配置分数按钮选择器');
  }

  // 查找所有分数按钮
  const buttons = document.querySelectorAll(scoreButtonSelector);

  if (buttons.length === 0) {
    throw new Error('未找到分数按钮');
  }

  // 尝试找到对应分数的按钮
  let targetButton = null;

  for (const btn of buttons) {
    const text = btn.innerText || btn.textContent;
    // 尝试匹配按钮文本
    if (text && text.trim() === String(score)) {
      targetButton = btn;
      break;
    }

    // 也检查 value 或其他属性
    if (btn.value === String(score) || btn.dataset.score === String(score)) {
      targetButton = btn;
      break;
    }
  }

  if (targetButton) {
    targetButton.click();
    return;
  }

  // 如果没找到精确匹配，尝试数字匹配
  for (const btn of buttons) {
    const num = parseInt(btn.innerText || btn.textContent);
    if (num === score) {
      btn.click();
      return;
    }
  }

  throw new Error(`未找到 ${score} 分的按钮`);
}

// 通知用户需要配置选择器（当提取失败时）
function notifyNeedsConfiguration() {
  // 创建一个简单的提示
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 16px;
    z-index: 999999;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  `;
  notification.innerHTML = `
    <strong>作文批改助手</strong>
    <p style="margin: 8px 0; font-size: 14px; color: #333;">
      请在扩展 popup 中配置作文区域和分数按钮的选择器。
    </p>
    <p style="font-size: 12px; color: #666;">
      按 F12 打开开发者工具，使用元素选择器查看作文区域和分数按钮的 class 或 id。
    </p>
  `;
  document.body.appendChild(notification);

  // 5秒后自动移除
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

console.log('作文批改助手 content script 已加载');
