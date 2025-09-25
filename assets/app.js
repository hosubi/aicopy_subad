// === App Configuration ===
const CONFIG = {
  // Make.com 웹훅 설정 (페이지별로 다른 웹훅 사용)
  WEBHOOKS: {
    // G폴더 페이지별 웹훅 (8개)
    "naver-home": "https://hook.make.com/naver-home-webhook",
    "place-copy": "https://hook.make.com/place-copy-webhook", 
    "blog-intro": "https://hook.make.com/blog-intro-webhook",
    "cta": "https://hook.make.com/cta-webhook",
    "hso": "https://hook.make.com/hso-webhook",
    "swot": "https://hook.make.com/swot-webhook",
    "title-banger": "https://hook.eu2.make.com/wj1zi56xcnxtv2nq5rwkjk8lg5n5fbaa",
    "paid-blog": "https://hook.make.com/paid-blog-webhook",
    
    // 소셜미디어 페이지별 웹훅 (2개)
    "instagram-caption": "https://hook.eu2.make.com/jyv69e13xe1bj1dyj7oqpr6m4mzg3e1z",
    "threads-copy": "https://hook.eu2.make.com/k3z1yt8cetom0na65wioi57v4v1up3bn",
    
    // 추가 페이지들 (향후 확장용)
    "youtube-shorts": "https://hook.make.com/youtube-webhook",
    "menu-description": "https://hook.make.com/menu-webhook",
    "event-promotion": "https://hook.make.com/event-webhook",
    "review-response": "https://hook.make.com/review-webhook",
    
    // 기본 웹훅
    default: "https://hook.make.com/default-webhook"
  },
  APP_SECRET: "YOUR_RANDOM_SECRET",
  
  // 카피 타입별 프롬프트 힌트 (Make.com에서 참조)
  COPY_TYPES: {
    "title-banger": { name: "썸네일 제목", category: "general" },
    "naver-home": { name: "네이버 홈판용", category: "general" },
    "naver-place": { name: "네이버 플레이스", category: "business" },
    "blog-intro": { name: "블로그 서론", category: "general" },
    "blog-full": { name: "블로그 전체글", category: "premium" },
    "cta": { name: "CTA 카피", category: "general" },
    "hso": { name: "HSO 3줄", category: "general" },
    "swot": { name: "SWOT 분석", category: "general" },
    "instagram-caption": { name: "인스타그램 캡션", category: "social" },
    "threads-copy": { name: "쓰레드 카피", category: "social" },
    "youtube-shorts": { name: "유튜브 쇼츠", category: "social" },
    "tiktok-script": { name: "틱톡 스크립트", category: "social" },
    "menu-description": { name: "메뉴 설명", category: "business" },
    "event-promotion": { name: "이벤트 홍보", category: "business" },
    "review-response": { name: "리뷰 답변", category: "business" },
    "kakao-message": { name: "카카오 메시지", category: "business" },
  }
};

// === API 호출 함수 ===

// Make.com 웹훅을 통한 LLM 호출
async function callLLM(type, userText) {
  const copyInfo = CONFIG.COPY_TYPES[type] || { category: "general" };
  const webhookUrl = CONFIG.WEBHOOKS[type] || CONFIG.WEBHOOKS.default;
  
  console.log('🚀 웹훅 호출 시작:', { type, userText, webhookUrl });
  
  try {
    // 30초 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000);
    
    const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        prompt: userText,  // Make.com에서 기대하는 형식
        type, 
        userText,
        category: copyInfo.category,
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📥 응답 상태:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Make 시나리오 호출 실패 (status: ${response.status})`);
    }
    
    // 응답을 텍스트로 먼저 받기
    const textData = await response.text();
    console.log('📄 응답 원본:', textData);
    
    let finalResult = textData;
    try {
      // JSON 파싱 시도
      const parsed = JSON.parse(textData);
      console.log('📊 파싱된 JSON:', parsed);
      
      finalResult = parsed["카피"] 
                 || parsed["result"] 
                 || parsed["text"]
                 || parsed["output"]
                 || parsed["response"]
                 || textData;
    } catch(e) {
      console.warn('JSON 파싱 실패, 일반 텍스트로 처리:', e);
      finalResult = textData;
    }
    
    // 결과 정리
    if (typeof finalResult === 'string') {
      finalResult = finalResult.trim();
    }
    
    console.log('✅ 최종 결과:', finalResult);
    
    if (!finalResult || finalResult === '') {
      throw new Error('빈 응답을 받았습니다.');
    }
    
    return finalResult;
    
  } catch (error) {
    console.error("❌ API 호출 실패:", error);
    
    if (error.name === 'AbortError') {
      throw new Error('요청이 30초를 초과했습니다. 잠시 후 다시 시도해주세요.');
    } else {
      throw new Error(`서버 연결 실패: ${error.message}`);
    }
  }
}

// 사용자 API 키를 사용한 직접 호출 (Premium 기능)
async function callLLMWithUserAPI(type, userText, apiKey) {
  if (!apiKey) {
    return await callLLM(type, userText); // 기본 웹훅 사용
  }
  
  try {
    // 사용량 체크
    if (!checkAPIUsage(apiKey)) {
      throw new Error("일일 사용량을 초과했습니다. 내일 다시 시도해주세요.");
    }
    
    const prompt = generatePrompt(type, userText);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: getSystemPrompt(type) },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";
    
    // 사용량 기록
    trackAPIUsage(apiKey);
    
    return result.trim();
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    throw new Error("API 호출에 실패했습니다. API 키를 확인해주세요.");
  }
}

// === 프롬프트 생성 함수 ===
function getSystemPrompt(type) {
  const prompts = {
    "instagram-caption": "당신은 인스타그램 마케팅 전문가입니다. 감성적이고 공감가는 캡션을 작성하며, 적절한 이모지와 해시태그를 포함합니다.",
    "naver-place": "당신은 네이버 플레이스 최적화 전문가입니다. 검색에 잘 노출되고 클릭률이 높은 소개문을 작성합니다.",
    "menu-description": "당신은 메뉴 카피라이팅 전문가입니다. 식욕을 자극하고 주문하고 싶게 만드는 메뉴 설명을 작성합니다.",
    "review-response": "당신은 고객 응대 전문가입니다. 진심어린 감사와 전문적인 태도로 리뷰에 답변합니다.",
    default: "당신은 전문 카피라이터입니다. 효과적이고 설득력 있는 마케팅 문구를 작성합니다."
  };
  
  return prompts[type] || prompts.default;
}

function generatePrompt(type, userText) {
  const templates = {
    "instagram-caption": `다음 내용으로 인스타그램 캡션을 작성해주세요: ${userText}\n\n요구사항:\n1. 공감가는 스토리텔링\n2. 적절한 이모지 사용\n3. 관련 해시태그 5-10개 포함\n4. CTA 포함`,
    "naver-place": `다음 업체의 네이버 플레이스 소개문을 작성해주세요: ${userText}\n\n요구사항:\n1. 핵심 키워드 포함\n2. 업체 특장점 강조\n3. 방문 유도 문구\n4. 150자 이내`,
    default: `다음 내용으로 마케팅 카피를 작성해주세요: ${userText}`
  };
  
  return templates[type] || templates.default;
}

// === 사용량 관리 함수 ===
function checkAPIUsage(apiKey) {
  const usage = JSON.parse(localStorage.getItem('apiUsage') || '{}');
  const today = new Date().toDateString();
  const dailyLimit = 100;
  
  if (!usage[today]) usage[today] = {};
  const currentUsage = usage[today][apiKey] || 0;
  
  return currentUsage < dailyLimit;
}

function trackAPIUsage(apiKey) {
  const usage = JSON.parse(localStorage.getItem('apiUsage') || '{}');
  const today = new Date().toDateString();
  
  if (!usage[today]) usage[today] = {};
  if (!usage[today][apiKey]) usage[today][apiKey] = 0;
  
  usage[today][apiKey]++;
  localStorage.setItem('apiUsage', JSON.stringify(usage));
}

// === UI 관련 함수 ===

// 최근 카피 표시 (최신 5개만)
function displayRecentCopies() {
  const recentCopyEl = document.getElementById('recent-copy');
  if (!recentCopyEl) return;

  const recentCopies = JSON.parse(localStorage.getItem('recentCopies') || '[]');
  const displayCopies = recentCopies.slice(0, 5); // 최신 5개만 표시
  recentCopyEl.innerHTML = '';

  if (displayCopies.length === 0) {
    recentCopyEl.innerHTML = '<p style="color: var(--text-muted); text-align: center;">아직 생성된 카피가 없습니다.</p>';
    return;
  }

  displayCopies.forEach((item, index) => {
    const copyItem = document.createElement('div');
    copyItem.className = 'recent-copy-item';
    copyItem.style.animationDelay = `${index * 0.1}s`;
    copyItem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px; padding: 16px; background: var(--bg-light); border-radius: 8px; margin-bottom: 12px; border: 1px solid var(--border-color);">
        <div style="flex: 1;">
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 6px;">
            <span style="background: var(--primary-yellow-light); color: var(--primary-yellow-dark); padding: 2px 8px; border-radius: 12px; font-weight: 500; margin-right: 8px;">
              ${item.type || '카피'}
            </span>
            ${formatTimeAgo(item.timestamp)}
          </div>
          <div style="line-height: 1.5; word-break: break-word;">${item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text}</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <button onclick="copyToClipboard('${item.text.replace(/'/g, "\\'").replace(/\n/g, "\\n")}')" 
                  style="padding: 6px 12px; background: var(--primary-yellow-dark); color: white; border: none; 
                         border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500;">
            복사
          </button>
          <button onclick="removeRecentCopy(${index})" 
                  style="padding: 6px 12px; background: #dc3545; color: white; border: none; 
                         border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500;">
            삭제
          </button>
        </div>
      </div>
    `;
    recentCopyEl.appendChild(copyItem);
  });

  // 전체 삭제 버튼 (항목이 있을 때만)
  if (recentCopies.length > 0) {
    const clearAllBtn = document.createElement('div');
    clearAllBtn.innerHTML = `
      <div style="text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
        <button onclick="clearAllRecentCopies()" 
                style="padding: 10px 20px; background: #6c757d; color: white; border: none; 
                       border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
          전체 삭제 (${recentCopies.length}개)
        </button>
      </div>
    `;
    recentCopyEl.appendChild(clearAllBtn);
  }
}

// 시간 포맷팅
function formatTimeAgo(timestamp) {
  if (!timestamp) return '방금 전';
  
  const now = new Date();
  const past = new Date(timestamp);
  const diff = Math.floor((now - past) / 1000);
  
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

// 클립보드 복사
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('복사되었습니다!');
  } catch (err) {
    console.error('복사 실패:', err);
    showToast('복사에 실패했습니다.');
  }
}

// 토스트 메시지
function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--text-primary);
    color: var(--bg-white);
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    z-index: 9999;
    animation: slideUp 0.3s ease-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// 애드센스 전면광고 표시 (3번째 생성마다)
let generateCount = parseInt(localStorage.getItem('generateCount') || '0');

function showInterstitialAd() {
  // 애드센스 전면광고 코드
  if (window.adsbygoogle) {
    console.log('Showing interstitial ad...');
    // 실제 구현은 애드센스 정책에 따라 처리
  }
}

// === 메인 생성기 설정 ===
function setupGenerator(currentType) {
  const $ = (id) => document.getElementById(id);
  const inputEl = $("kw") || $("input");
  const outEl = $("out");
  const genBtn = $("gen");
  const copyBtn = $("copy");
  const typeSelect = $("copyType");

  if (!inputEl || !outEl || !genBtn || !copyBtn) return;

  // 현재 카피 타입 설정
  window.currentCopyType = currentType;
  if (typeSelect) {
    typeSelect.value = currentType;
  }

  // 초기 화면 로드
  displayRecentCopies();

  // 생성 버튼 클릭
  genBtn.onclick = async () => {
    const userText = inputEl.value.trim();
    if (!userText) {
      showToast("키워드를 입력해주세요!");
      inputEl.focus();
      return;
    }

    // 버튼 상태 변경
    genBtn.disabled = true;
    const btnText = genBtn.querySelector('.btn-text');
    const btnLoading = genBtn.querySelector('.btn-loading');
    
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
    
    outEl.classList.add('loading');
    outEl.textContent = "AI가 카피를 생성하고 있습니다...";
    copyBtn.disabled = true;

    try {
      // 생성 횟수 증가 및 광고 체크
      generateCount++;
      localStorage.setItem('generateCount', generateCount.toString());
      
      if (generateCount % 3 === 0) {
        showInterstitialAd();
      }

      // API 키 확인
      const userApiKey = localStorage.getItem('userApiKey');
      const useType = typeSelect ? typeSelect.value : currentType;
      
      // API 호출
      const result = await callLLMWithUserAPI(useType, userText, userApiKey);
      
      // 결과 표시
      outEl.classList.remove('loading');
      outEl.textContent = result || "생성된 결과가 없습니다.";
      copyBtn.disabled = !result;

      // 결과 저장
      if (result) {
        saveRecentCopy(result, useType);
        displayRecentCopies();
      }
    } catch (error) {
      outEl.classList.remove('loading');
      outEl.textContent = `오류: ${error.message}`;
      showToast(error.message, 3000);
    } finally {
      genBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnLoading) btnLoading.style.display = 'none';
    }
  };

  // 복사 버튼 클릭
  copyBtn.onclick = async () => {
    const text = (outEl.textContent || "").trim();
    if (!text || text.includes('오류:')) return;
    
    await copyToClipboard(text);
    
    // 버튼 텍스트 임시 변경
    const originalText = copyBtn.querySelector('.btn-text').textContent;
    copyBtn.querySelector('.btn-text').textContent = "복사됨!";
    setTimeout(() => {
      copyBtn.querySelector('.btn-text').textContent = originalText;
    }, 1000);
  };

  // 엔터키로 생성
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      genBtn.click();
    }
  });
}

// 최근 카피 저장
function saveRecentCopy(text, type) {
  let recentCopies = JSON.parse(localStorage.getItem('recentCopies') || '[]');
  
  recentCopies.unshift({
    text: text,
    type: CONFIG.COPY_TYPES[type]?.name || type,
    timestamp: new Date().toISOString()
  });
  
  // 최대 10개만 저장
  recentCopies = recentCopies.slice(0, 10);
  
  localStorage.setItem('recentCopies', JSON.stringify(recentCopies));
}

// === API 키 설정 UI ===
function showAPIKeySettings() {
  const currentKey = localStorage.getItem('userApiKey');
  const hasKey = currentKey && currentKey.length > 0;
  
  const modal = document.createElement('div');
  modal.className = 'api-modal';
  modal.innerHTML = `
    <div class="api-modal-content">
      <h3>API 키 설정</h3>
      <p>자체 OpenAI API 키를 사용하면 제한 없이 카피를 생성할 수 있습니다.</p>
      <input type="password" id="apiKeyInput" placeholder="sk-..." value="${currentKey || ''}" />
      <div class="api-modal-buttons">
        <button onclick="saveAPIKey()">저장</button>
        <button onclick="closeAPIModal()">취소</button>
        ${hasKey ? '<button onclick="removeAPIKey()">삭제</button>' : ''}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function saveAPIKey() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (apiKey) {
    localStorage.setItem('userApiKey', apiKey);
    showToast('API 키가 저장되었습니다.');
  }
  closeAPIModal();
}

function removeAPIKey() {
  localStorage.removeItem('userApiKey');
  showToast('API 키가 삭제되었습니다.');
  closeAPIModal();
}

function closeAPIModal() {
  document.querySelector('.api-modal')?.remove();
}

// === CSS 애니메이션 추가 ===
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from { transform: translate(-50%, 100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
  
  @keyframes slideDown {
    from { transform: translate(-50%, 0); opacity: 1; }
    to { transform: translate(-50%, 100%); opacity: 0; }
  }
  
  .recent-copy-item {
    animation: fadeInUp 0.4s ease-out both;
  }
  
  .api-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  
  .api-modal-content {
    background: var(--bg-white);
    padding: 32px;
    border-radius: 16px;
    max-width: 400px;
    width: 90%;
    box-shadow: var(--shadow-lg);
  }
  
  .api-modal-content h3 {
    margin: 0 0 16px 0;
  }
  
  .api-modal-content input {
    width: 100%;
    padding: 12px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    margin: 16px 0;
  }
  
  .api-modal-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .api-modal-buttons button {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }
`;
document.head.appendChild(style);

// 개별 항목 삭제
function removeRecentCopy(index) {
  const recentCopies = JSON.parse(localStorage.getItem('recentCopies') || '[]');
  if (index >= 0 && index < recentCopies.length) {
    recentCopies.splice(index, 1);
    localStorage.setItem('recentCopies', JSON.stringify(recentCopies));
    displayRecentCopies();
    showToast('카피가 삭제되었습니다.');
  }
}

// 전체 삭제
function clearAllRecentCopies() {
  if (confirm('모든 카피 기록을 삭제하시겠습니까?')) {
    localStorage.removeItem('recentCopies');
    displayRecentCopies();
    showToast('모든 카피가 삭제되었습니다.');
  }
}

// 전역 함수 export
window.callLLM = callLLM;
window.callLLMWithUserAPI = callLLMWithUserAPI;
window.setupGenerator = setupGenerator;
window.showAPIKeySettings = showAPIKeySettings;
window.copyToClipboard = copyToClipboard;
window.removeRecentCopy = removeRecentCopy;
window.clearAllRecentCopies = clearAllRecentCopies;