QuickMVP — AdSense 친화 다중 페이지 + Make.com 프록시 템플릿

1) /assets/app.js 에서 아래 두 값을 교체하세요.
   - MAKE_WEBHOOK_URL = "https://hook.make.com/XXXX"
   - APP_SECRET = "YOUR_RANDOM_SECRET"  // Make 필터와 동일

2) Make.com 시나리오
   - Webhook → Filter(X-App-Secret, 길이 제한, type 화이트리스트) →
     Set variables(system_prompt) → HTTP(OpenAI) → Webhook Response({ text })
   - type 값: title-banger, naver-home, place-copy, blog-intro, cta, hso, swot, paid-blog

3) AdSense
   - 모든 페이지 <head>에 주석 처리된 스크립트를 해제하고 client/slot 값을 입력하세요.
   - 광고 영역은 .ad-wrap placeholder로 CLS 방지.
   - 버튼/입력 폼과 최소 24px 이상 여백을 두세요.

4) 배포
   - 워드프레스 도메인의 서브폴더에 업로드하거나, 정적 호스팅(Netlify/CF Pages) 사용.
   - 내부 페이지는 /g/ 폴더에 있습니다.

5) 커스터마이즈
   - 각 페이지 상단의 "후킹/걱정/해결" 한 줄은 자유롭게 수정하세요.
   - /g/ 에 원하는 생성기 페이지를 복제 후 type과 카피만 변경하면 확장됩니다.
