// === 공통 컴포넌트 관리 ===

// 헤더 HTML 템플릿

const AD_BOTTOM_HTML = `
<div class="ad-wrap">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2658372907170284"
  crossorigin="anonymous"></script>
<ins class="adsbygoogle"
  style="display:block"
  data-ad-format="autorelaxed"
  data-ad-client="ca-pub-2658372907170284"
  data-ad-slot="7949523922"></ins>
<script>
  (adsbygoogle = window.adsbygoogle || []).push({});
</script>
</div>
`;

// === App Configuration ===
// === App Configuration ===
const CONFIG = {
  // Make.com 웹훅 설정 (페이지별로 다른 웹훅 사용)
  WEBHOOKS: {
    // G폴더 페이지별 웹훅 (8개)
    "naver-home": "https://hook.eu2.make.com/m1wonq9rwcxyemx4hnedhyylu4p9hpbr",
    "place-copy": "https://hook.eu2.make.com/n3d1kbidwcj175jiq9lr7wnocukjxukm", 
    "blog-intro": "https://hook.eu2.make.com/36dn8226jdscprg83vdpndund923pfz4",
    "cta": "https://hook.eu2.make.com/469b34r723epzhqy6cqfbryijcv78x72",
    "hso": "https://hook.eu2.make.com/4vikl7bu11rcciw7i89n9wk0nxyvi4pl",
    "swot": "https://hook.eu2.make.com/a7bw52sj72ghgqqvjov7bskxuk4lxxis",
    "title-banger": "https://hook.eu2.make.com/3ouzhllwrfc3c5gvsuhceezwaimofqdn",
    "paid-blog": "https://hook.make.com/paid-blog-webhook",
    
    // 소셜미디어 페이지별 웹훅 (2개)
    "instagram-caption": "https://hook.eu2.make.com/jyv69e13xe1bj1dyj7oqpr6m4mzg3e1z",
    "threads-copy": "https://hook.eu2.make.com/6etu7qbrxrow4r6h2fnbnth5hniu16n8",
    
    // 추가 페이지들 (향후 확장용)
    "youtube-shorts": "https://hook.make.com/youtube-webhook",
    "menu-description": "https://hook.eu2.make.com/8wl1arczu59lfmiyv1dj3s3x79hdlw7o",
    "event-promotion": "https://hook.make.com/event-webhook",
    "review-response": "https://hook.eu2.make.com/0m1z7yr62g1tbq4ole9nyn4jdivvr37u",
    "cupang-response": "https://hook.eu2.make.com/mvqwytao6boof4sb17xhid36snape639",
    
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
    "cupng-response": { name: "쿠팡이츠 댓글답글", category: "business" },
  }
};

// === API 호출 함수 ===

// Make.com 웹훅을 통한 LLM 호출
async function callLLM(type, userText) {
  // 사용량 체크 (생성기 버튼에서만)
  const usageInfo = checkDailyUsage();
  if (!usageInfo.canUse) {
    // 일일 한계 도달시 플로팅 버튼 안내
    throw new Error(`오늘 사용량을 모두 사용했습니다. (${usageInfo.used}/${usageInfo.totalLimit}회)\n\n💡 오른쪽 아래 공유/책 버튼을 클릭하면 일일 한도가 추가됩니다!`);
  }
  
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
    
    // 성공시 사용량 증가
    incrementDailyUsage();
    
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

// === 일일 사용량 관리 (5회 제한) ===
function checkDailyUsage() {
  const today = new Date().toDateString();
  const usageData = JSON.parse(localStorage.getItem('dailyUsage') || '{}');
  
  if (!usageData[today]) {
    usageData[today] = {
      used: 0,
      shareBonus: 0,
      bookBonus: 0
    };
    localStorage.setItem('dailyUsage', JSON.stringify(usageData));
  }
  
  const dayData = usageData[today];
  const baseLimit = 5;
  const bonusLimit = dayData.shareBonus + dayData.bookBonus;
  const totalLimit = baseLimit + bonusLimit;
  
  return {
    canUse: dayData.used < totalLimit,
    used: dayData.used,
    remaining: Math.max(0, totalLimit - dayData.used),
    totalLimit: totalLimit,
    shareBonus: dayData.shareBonus,
    bookBonus: dayData.bookBonus
  };
}

// 사용량 증가 (생성기 버튼에서만 호출)
function incrementDailyUsage() {
  const today = new Date().toDateString();
  const usageData = JSON.parse(localStorage.getItem('dailyUsage') || '{}');
  
  if (!usageData[today]) {
    usageData[today] = { used: 0, shareBonus: 0, bookBonus: 0 };
  }
  
  usageData[today].used++;
  localStorage.setItem('dailyUsage', JSON.stringify(usageData));
  
  console.log(`📊 사용량: ${usageData[today].used}회`);
  
  // 5회 사용시 팝업 표시
  if (usageData[today].used === 5 && (usageData[today].shareBonus + usageData[today].bookBonus) === 0) {
    setTimeout(() => showUsageLimitPopup(), 1000);
  }
}

// 공유 보너스 적용
function applyShareBonus() {
  const today = new Date().toDateString();
  const usageData = JSON.parse(localStorage.getItem('dailyUsage') || '{}');
  
  if (!usageData[today]) {
    usageData[today] = { used: 0, shareBonus: 0, bookBonus: 0 };
  }
  
  // 처음 2회, 그 다음부터 1회씩 무한대로
  let bonusAmount;
  if (usageData[today].shareBonus === 0) {
    bonusAmount = 2; // 첫 번째는 2회
  } else {
    bonusAmount = 1; // 그 다음부터는 1회씩
  }
  
  usageData[today].shareBonus += bonusAmount;
  localStorage.setItem('dailyUsage', JSON.stringify(usageData));
  
  showToast(`🎉 공유 완료! +${bonusAmount}회 추가되었습니다!`, 3000);
  updateFloatingButtons();
  return true;
}

// 책 보너스 적용
function applyBookBonus() {
  const today = new Date().toDateString();
  const usageData = JSON.parse(localStorage.getItem('dailyUsage') || '{}');
  
  if (!usageData[today]) {
    usageData[today] = { used: 0, shareBonus: 0, bookBonus: 0 };
  }
  
  // 처음 2회, 그 다음부터 1회씩 무한대로
  let bonusAmount;
  if (usageData[today].bookBonus === 0) {
    bonusAmount = 2; // 첫 번째는 2회
  } else {
    bonusAmount = 1; // 그 다음부터는 1회씩
  }
  
  usageData[today].bookBonus += bonusAmount;
  localStorage.setItem('dailyUsage', JSON.stringify(usageData));
  
  showToast(`📚 책 확인 완료! +${bonusAmount}회 추가되었습니다!`, 3000);
  updateFloatingButtons();
  return true;
}

// 5회 사용 제한 팝업
function showUsageLimitPopup() {
  // 기존 팝업이 있으면 제거
  const existingPopup = document.querySelector('.usage-popup-overlay');
  if (existingPopup) existingPopup.remove();
  
  const popup = document.createElement('div');
  popup.className = 'usage-popup-overlay';
  popup.innerHTML = `
    <div class="usage-popup">
      <div class="popup-icon">⚠️</div>
      <h3>일일 사용량을 다 사용하셨습니다</h3>
      <p>도움이 되셨다면,<br><strong>공유하고 2회 더 사용하세요!</strong></p>
      <p class="popup-hint">마케팅 책 구매로 소정의 수수료를 받을 수 있습니다.<br>마케팅 공부는 더 좋은 서비스 업그레이드에 도움이 됩니다!</p>
      
      <div class="popup-buttons">



        <button class="popup-btn popup-btn-share" onclick="handleFloatingShare()">
          📤 도움필요한사람에게 공유하고 +2회
        </button>
        


        <button class="popup-btn popup-btn-book" onclick="handleFloatingBook()">
          📚 마케팅책 구매로 +2회  
        </button>
        <button class="popup-btn popup-btn-close" onclick="closeUsagePopup()">
          나중에
        </button>
      </div>
            <script src="https://ads-partners.coupang.com/g.js"></script>
<script>
    new PartnersCoupang.G({"id":848257,"trackingCode":"AF8239972","subId":null,"template":"carousel","width":"680","height":"140"});
</script>
    </div>
  `;
  
  document.body.appendChild(popup);
}

function closeUsagePopup() {
  const popup = document.querySelector('.usage-popup-overlay');
  if (popup) popup.remove();
}

// 플로팅 버튼 생성
function createFloatingButtons() {
  const existing = document.getElementById('floating-container');
  if (existing) existing.remove();
  
  const floatingContainer = document.createElement('div');
  floatingContainer.id = 'floating-container';
  floatingContainer.innerHTML = `
    <div class="floating-buttons">
      <button id="floating-share" class="floating-btn floating-share" title="공유하고 +2회 받기">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
        </svg>
      </button>
      
      <button id="floating-book" class="floating-btn floating-book" title="마케팅 자료보고 +2회 받기">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
        </svg>
      </button>
    </div>
  `;
  
  document.body.appendChild(floatingContainer);
  
  // 이벤트 바인딩
  const shareBtn = document.getElementById('floating-share');
  const bookBtn = document.getElementById('floating-book');
  
  if (shareBtn) shareBtn.addEventListener('click', handleFloatingShare);
  if (bookBtn) bookBtn.addEventListener('click', handleFloatingBook);
  
  updateFloatingButtons();
}

// 플로팅 버튼 클릭 처리
function handleFloatingShare() {
  // 항상 팝업을 먼저 표시
  showUsageLimitPopup();
  const success = applyShareBonus();
}

function handleFloatingBook() {
  // 항상 팝업을 먼저 표시
  showUsageLimitPopup();
  const success = applyBookBonus();
}

// 플로팅 버튼 상태 업데이트
function updateFloatingButtons() {
  const usageInfo = checkDailyUsage();
  const shareBtn = document.getElementById('floating-share');
  const bookBtn = document.getElementById('floating-book');
  
  // 항상 활성화 상태로 유지 (무한 보너스)
  if (shareBtn) {
    shareBtn.style.opacity = '1';
    shareBtn.style.cursor = 'pointer';
    if (usageInfo.shareBonus === 0) {
      shareBtn.title = '공유하고 +2회 받기';
    } else {
      shareBtn.title = '공유하고 +1회 받기';
    }
  }
  
  if (bookBtn) {
    bookBtn.style.opacity = '1';
    bookBtn.style.cursor = 'pointer';
    if (usageInfo.bookBonus === 0) {
      bookBtn.title = '마케팅 자료보고 +2회 받기';
    } else {
      bookBtn.title = '마케팅 자료보고 +1회 받기';
    }
  }
}

// === UI 관련 함수 ===

// 최근 카피 표시 (페이지별 개별, 최신 5개만)
function displayRecentCopies() {
  const recentCopyEl = document.getElementById('recent-copy');
  if (!recentCopyEl) return;

  // 현재 페이지 타입 확인
  const currentType = window.currentCopyType || 'title-banger';
  const storageKey = `recentCopies_${currentType}`;
  
  const recentCopies = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const displayCopies = recentCopies.slice(0, 5); // 최신 5개만 표시
  recentCopyEl.innerHTML = '';

  if (displayCopies.length === 0) {
    recentCopyEl.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
        <p style="margin: 0; font-size: 16px;">아직 생성된 카피가 없습니다.</p>
        <p style="margin: 8px 0 0 0; font-size: 14px;">위에서 키워드를 입력하고 생성해보세요!</p>
      </div>
    `;
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
        <button onclick="clearRecentCopies('${currentType}')" 
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

  console.log('🔧 setupGenerator 호출됨:', currentType);
  console.log('🔍 요소 검색 결과:', {
    inputEl: !!inputEl,
    outEl: !!outEl,
    genBtn: !!genBtn,
    copyBtn: !!copyBtn,
    typeSelect: !!typeSelect
  });

  if (!inputEl || !outEl || !genBtn || !copyBtn) {
    console.error('❌ 필수 요소를 찾을 수 없습니다:', {
      inputEl: !!inputEl,
      outEl: !!outEl,
      genBtn: !!genBtn,
      copyBtn: !!copyBtn
    });
    return;
  }

  // 현재 카피 타입 설정
  window.currentCopyType = currentType;
  if (typeSelect) {
    typeSelect.value = currentType;
  }

  // 초기 화면 로드
  displayRecentCopies();

  // 생성 버튼 클릭
  genBtn.onclick = async () => {
    console.log('🚀 생성 버튼 클릭됨 (setupGenerator)');
    const userText = inputEl.value.trim();
    console.log('📝 입력값:', userText);
    
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
      
      console.log('🔗 API 호출 준비:', { useType, userApiKey: !!userApiKey });
      
      // API 호출
      const result = await callLLMWithUserAPI(useType, userText, userApiKey);
      console.log('📥 API 결과 수신:', result);
      
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

// 최근 카피 저장 (페이지별 개별 저장)
function saveRecentCopy(text, type) {
  if (!text || text.trim() === '') return;
  
  // 페이지별로 다른 저장소 키 사용
  const storageKey = `recentCopies_${type}`;
  let recentCopies = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  const newCopy = {
    text: text.trim(),
    type: CONFIG.COPY_TYPES[type]?.name || type,
    timestamp: new Date().toISOString(),
    id: Date.now()
  };
  
  // 중복 제거
  recentCopies = recentCopies.filter(item => item.text !== newCopy.text);
  
  // 맨 앞에 추가
  recentCopies.unshift(newCopy);
  
  // 최대 10개만 저장 (표시는 5개)
  recentCopies = recentCopies.slice(0, 10);
  
  localStorage.setItem(storageKey, JSON.stringify(recentCopies));
  
  console.log(`💾 ${type} 카피 저장됨:`, newCopy);
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

  /* === 플로팅 버튼 스타일 === */
  .floating-buttons {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .floating-btn {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
  }

  .floating-share {
    background: #FFD700;
    color: #333;
  }

  .floating-book {
    background: #FFD700;
    color: #333;
  }

  .floating-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
  }

  /* === 사용량 제한 팝업 스타일 === */
  .usage-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .usage-popup {
    background: white;
    padding: 30px;
    border-radius: 16px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }

  .popup-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }

  .usage-popup h3 {
    margin: 0 0 16px 0;
    color: #333;
    font-size: 1.25rem;
  }

  .usage-popup p {
    margin: 0 0 12px 0;
    color: #666;
    line-height: 1.5;
  }

  .popup-hint {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 8px;
    border-left: 4px solid #FF9800;
    margin: 16px 0;
    font-size: 0.9rem;
  }

  .popup-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
  }

  .popup-btn {
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    font-size: 0.9rem;
  }

  .popup-btn-share {
    background:rgb(255, 217, 0);
    color: white;
  }

  .popup-btn-book {
    background:rgb(255, 217, 0);
    color: white;
  }

  .popup-btn-close {
    background: #f5f5f5;
    color: #666;
  }

  .popup-btn:hover {
    transform: translateY(-1px);
    opacity: 0.9;
  }

  /* === 모바일 반응형 === */
  @media (max-width: 768px) {
    .floating-buttons {
      bottom: 80px;
      right: 16px;
    }
    
    .floating-btn {
      width: 45px;
      height: 45px;
    }
    
    .usage-popup {
      padding: 24px 20px;
      margin: 20px;
    }
    
    .popup-icon {
      font-size: 2.5rem;
    }
    
    .usage-popup h3 {
      font-size: 1.1rem;
    }
  }
`;
document.head.appendChild(style);

// 개별 항목 삭제 (페이지별)
function removeRecentCopy(index) {
  const currentType = window.currentCopyType || 'title-banger';
  const storageKey = `recentCopies_${currentType}`;
  
  const recentCopies = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (index >= 0 && index < recentCopies.length) {
    recentCopies.splice(index, 1);
    localStorage.setItem(storageKey, JSON.stringify(recentCopies));
    displayRecentCopies();
    showToast('카피가 삭제되었습니다.');
  }
}

// 전체 삭제 (페이지별)
function clearRecentCopies(type) {
  if (confirm('이 페이지의 모든 카피 기록을 삭제하시겠습니까?')) {
    const storageKey = `recentCopies_${type}`;
    localStorage.removeItem(storageKey);
    displayRecentCopies();
    showToast('모든 카피가 삭제되었습니다.');
  }
}

// 구버전 호환용 (삭제 예정)
function clearAllRecentCopies() {
  const currentType = window.currentCopyType || 'title-banger';
  clearRecentCopies(currentType);
}

// 페이지별 웹훅 테스트
async function testPageWebhook(type) {
  const webhookUrl = CONFIG.WEBHOOKS[type] || CONFIG.WEBHOOKS.default;
  
  console.log(`🧪 ${type} 웹훅 테스트 시작:`, webhookUrl);
  
  try {
    const testData = {
      prompt: "테스트 입력",
      type: type,
      userText: "테스트 입력",
      category: CONFIG.COPY_TYPES[type]?.category || "general",
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData)
    });
    
    console.log(`📥 ${type} 응답 상태:`, response.status);
    const responseText = await response.text();
    console.log(`📄 ${type} 응답 내용:`, responseText);
    
    return { 
      success: response.ok, 
      status: response.status, 
      data: responseText,
      url: webhookUrl
    };
  } catch (error) {
    console.error(`❌ ${type} 테스트 실패:`, error);
    return { 
      success: false, 
      error: error.message,
      url: webhookUrl
    };
  }
}

// 전체 페이지 웹훅 테스트
async function testAllWebhooks() {
  const pages = [
    'title-banger', 'naver-home', 'place-copy', 'blog-intro', 
    'cta', 'hso', 'swot', 'instagram-caption', 'threads-copy'
  ];
  
  console.log('🚀 전체 웹훅 테스트 시작...\n');
  console.log('실제 URL이 설정된 웹훅:');
  console.log('- title-banger:', CONFIG.WEBHOOKS['title-banger']);
  console.log('- instagram-caption:', CONFIG.WEBHOOKS['instagram-caption']);
  console.log('- threads-copy:', CONFIG.WEBHOOKS['threads-copy']);
  console.log('\n테스트 시작...\n');
  
  for (const page of pages) {
    const result = await testPageWebhook(page);
    console.log(`${result.success ? '✅' : '❌'} ${page}:`, result);
  }
}

// === 공통 컴포넌트 로더 함수 ===

// 현재 페이지 경로에 따라 active 클래스 설정
function setActiveNavigation() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    
    if (href === currentPath || 
        (currentPath === '/' && href === '/') ||
        (currentPath.includes(href) && href !== '/' && href.length > 1)) {
      link.classList.add('active');
    }
  });
}

// 모바일 메뉴 이벤트 바인딩
function bindMobileMenuEvents() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileSidebar = document.getElementById('mobileSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const closeSidebar = document.getElementById('closeSidebar');

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileSidebar.classList.add('active');
      sidebarOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  function closeMenu() {
    if (mobileSidebar) mobileSidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeSidebar) closeSidebar.addEventListener('click', closeMenu);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMenu);
}

// 헤더 로드
function loadHeader() {
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    headerPlaceholder.innerHTML = HEADER_HTML;
    setActiveNavigation();
    bindMobileMenuEvents();
    console.log('✅ 헤더 컴포넌트 로드 완료');
  }
}

// 푸터 로드
function loadFooter() {
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    footerPlaceholder.innerHTML = FOOTER_HTML;
    console.log('✅ 푸터 컴포넌트 로드 완료');
  }
}

// 광고 로드
function loadAds() {
  // 상단 광고
  const topAdPlaceholder = document.getElementById('ad-top-placeholder');
  if (topAdPlaceholder) {
    topAdPlaceholder.innerHTML = AD_TOP_HTML;
    console.log('✅ 상단 광고 컴포넌트 로드 완료');
  }
  
  // 하단 광고
  const bottomAdPlaceholder = document.getElementById('ad-bottom-placeholder');
  if (bottomAdPlaceholder) {
    bottomAdPlaceholder.innerHTML = AD_BOTTOM_HTML;
    console.log('✅ 하단 광고 컴포넌트 로드 완료');
  }
}

// 모든 공통 컴포넌트 로드
function loadCommonComponents() {
  console.log('🔧 공통 컴포넌트 로딩 시작');
  loadHeader();
  loadFooter();
  loadAds();
  console.log('🎉 모든 공통 컴포넌트 로딩 완료');
}

// DOMContentLoaded 이벤트에 공통 컴포넌트 로더 추가
document.addEventListener('DOMContentLoaded', function() {
  // 공통 컴포넌트 먼저 로드
  loadCommonComponents();
  
  // 플로팅 버튼 생성 (약간 지연)
  setTimeout(() => {
    createFloatingButtons();
  }, 500);
});

// 전역 함수 export
window.callLLM = callLLM;
window.callLLMWithUserAPI = callLLMWithUserAPI;
window.setupGenerator = setupGenerator;
window.showAPIKeySettings = showAPIKeySettings;
window.copyToClipboard = copyToClipboard;
window.removeRecentCopy = removeRecentCopy;
window.clearRecentCopies = clearRecentCopies;
window.clearAllRecentCopies = clearAllRecentCopies;
window.testPageWebhook = testPageWebhook;
window.testAllWebhooks = testAllWebhooks;
window.loadCommonComponents = loadCommonComponents;
window.loadHeader = loadHeader;
window.loadFooter = loadFooter;
window.loadAds = loadAds;
window.handleFloatingShare = handleFloatingShare;
window.handleFloatingBook = handleFloatingBook;
window.closeUsagePopup = closeUsagePopup;
window.checkDailyUsage = checkDailyUsage;
window.incrementDailyUsage = incrementDailyUsage;
window.applyShareBonus = applyShareBonus;
window.applyBookBonus = applyBookBonus;
window.updateFloatingButtons = updateFloatingButtons;