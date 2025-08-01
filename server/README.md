# 키움증권 API 서버

키움증권 HTS와 연동하는 로컬 API 서버입니다.

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
cd server
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
PORT=8080
KIWOOM_ACCOUNT=your_account
KIWOOM_PASSWORD=your_password
KIWOOM_CERT_PASSWORD=your_cert_password
NODE_ENV=development
```

### 3. 서버 실행
```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

## 📡 API 엔드포인트

### 로그인
- **POST** `/api/login`
- **Body**: `{ "userId": "아이디", "password": "비밀번호" }`

### 조건검색 결과
- **POST** `/api/condition/result`
- **Body**: `{ "conditionIndex": 0 }`

### 실시간 데이터 구독
- **POST** `/api/stock/realtime`
- **Body**: `{ "stockCodes": ["005930", "000660"] }`

### 주식 데이터
- **POST** `/api/stock/data`
- **Body**: `{ "stockCodes": ["005930", "000660"] }`

### 서버 상태 확인
- **GET** `/api/status`

## 🔌 WebSocket

실시간 데이터는 WebSocket을 통해 포트 8081에서 제공됩니다.

## 🧪 테스트

서버가 실행되면 다음 URL에서 상태를 확인할 수 있습니다:
- http://localhost:8080/api/status

## 📝 참고사항

현재는 시뮬레이션 모드로 동작합니다. 실제 키움증권 HTS 연동을 위해서는 키움증권 API 라이브러리를 추가로 설치해야 합니다. 