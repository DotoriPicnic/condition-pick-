const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

// CORS 설정
app.use(cors());
app.use(express.json());

// 테스트 API
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    htsConnected: true,
    timestamp: new Date().toISOString()
  });
});

// 로그인 API
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;
  
  console.log('로그인 시도:', { userId, password });
  
  if (userId && password) {
    res.json({
      success: true,
      message: '로그인 성공',
      sessionId: 'session_' + Date.now(),
      userId: userId
    });
  } else {
    res.status(400).json({
      success: false,
      message: '아이디와 비밀번호를 입력해주세요'
    });
  }
});

// 조건검색 결과 API
app.post('/api/condition/result', (req, res) => {
  const sampleData = [
    {
      종목명: "삼성전자",
      종목코드: "005930",
      현재가: 87200,
      등락폭: 1200,
      등락률: 1.39,
      거래량: 15000000,
      거래대금: 1308000000000
    },
    {
      종목명: "SK하이닉스",
      종목코드: "000660",
      현재가: 156000,
      등락폭: -2000,
      등락률: -1.27,
      거래량: 8000000,
      거래대금: 1248000000000
    }
  ];
  
  res.json(sampleData);
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 테스트 API 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}`);
  console.log(`🔗 상태 확인: http://localhost:${PORT}/api/status`);
});

// 프로세스 종료 방지
process.on('SIGINT', () => {
  console.log('서버를 종료합니다...');
  process.exit(0);
}); 