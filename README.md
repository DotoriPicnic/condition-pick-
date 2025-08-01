# Condition Pick - 키움증권 조건검색 결과 뷰어

키움증권 API를 연동하여 조건검색 결과를 실시간으로 확인할 수 있는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **키움증권 API 연동**: 실제 키움증권 API를 통해 조건검색 결과 조회
- **실시간 데이터**: 5분마다 자동으로 조건검색 결과 업데이트
- **반응형 디자인**: 모바일, 태블릿, 데스크톱에서 최적화된 UI
- **페이지 가시성 감지**: 백그라운드 상태에서 자동 새로고침 일시 중지
- **폴백 시스템**: API 오류 시 기존 데이터로 대체

## 🛠️ 기술 스택

- **Frontend**: React.js, Tailwind CSS
- **API**: 키움증권 API
- **배포**: Vercel
- **상태 관리**: React Hooks (useState, useEffect, useCallback)

## 📋 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/DotoriPicnic/condition-pick-.git
cd condition-pick-
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`env.example` 파일을 참고하여 `.env` 파일을 생성하고 키움증권 API 설정을 추가하세요:

```env
REACT_APP_KIWOOM_SERVER_URL=http://localhost:8080
REACT_APP_KIWOOM_API_KEY=your_api_key_here
REACT_APP_ENV=development
```

### 4. 개발 서버 실행
```bash
npm start
```

### 5. 빌드
```bash
npm run build
```

## 🔧 키움증권 API 설정

### API 서버 설정
키움증권 API 서버가 다음 엔드포인트를 제공해야 합니다:

- `POST /api/login` - 로그인
- `POST /api/condition/result` - 조건검색 결과 조회
- `POST /api/stock/realtime` - 실시간 데이터 구독
- `POST /api/stock/data` - 주식 데이터 조회

### 응답 형식
조건검색 결과는 다음 형식으로 응답해야 합니다:

```json
[
  {
    "종목명": "삼성전자",
    "종목코드": "005930",
    "현재가": 87200,
    "등락폭": 1200,
    "등락률": 1.39,
    "거래량": 15000000,
    "거래대금": 1308000000000
  }
]
```

## 🎯 사용 방법

1. **로그인**: 키움증권 아이디와 비밀번호로 로그인
2. **조건검색 인덱스 설정**: 사용할 조건검색의 인덱스 번호 입력
3. **결과 확인**: 조건검색 결과가 카드 형태로 표시됩니다
4. **자동 새로고침**: 5분마다 자동으로 데이터가 업데이트됩니다

## 🌐 배포

이 프로젝트는 Vercel을 통해 자동 배포됩니다:

- **프로덕션 URL**: https://condition-pick-q5hgatc9a-ysgille-2126s-projects.vercel.app
- **GitHub 연동**: main 브랜치에 푸시하면 자동 배포

## 📱 반응형 디자인

- **모바일**: 1열 그리드
- **태블릿**: 2열 그리드
- **데스크톱**: 3-4열 그리드

## 🔒 보안

- 키움증권 로그인 정보는 클라이언트에서만 사용되며 서버에 저장되지 않습니다
- API 키는 환경 변수로 관리됩니다

## 🐛 문제 해결

### API 연결 오류
- 키움증권 API 서버가 실행 중인지 확인
- 환경 변수 설정이 올바른지 확인
- 네트워크 연결 상태 확인

### 빌드 오류
- `npm install`로 의존성 재설치
- ESLint 경고는 `CI=false` 설정으로 해결

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
