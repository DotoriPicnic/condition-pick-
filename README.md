# Stock List View

React와 Tailwind CSS를 사용한 주식 리스트뷰 컴포넌트입니다.

## 기능

- GitHub 저장소에서 JSON 데이터를 자동으로 fetch
- 카드 형태로 종목 정보 표시 (종목명, 종목코드, 현재가)
- 로딩 상태, 에러 상태, 빈 데이터 상태 처리
- 반응형 디자인 (모바일, 태블릿, 데스크톱 지원)
- 호버 효과와 애니메이션

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 개발 서버 실행:
```bash
npm start
```

3. 빌드:
```bash
npm run build
```

## 사용법

```jsx
import StockListView from './StockListView';

function App() {
  return (
    <div className="App">
      <StockListView />
    </div>
  );
}
```

## 데이터 형식

컴포넌트는 다음 형식의 JSON 데이터를 기대합니다:

```json
[
  {
    "name": "삼성전자",
    "code": "005930",
    "price": 78000
  }
]
```

## 기술 스택

- React 18
- Tailwind CSS
- JavaScript (ES6+)

## 라이선스

MIT
