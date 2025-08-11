const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 8080;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 키움 API 연결 상태
let kiwoomConnected = false;
let kiwoomProcess = null;
let loginAttempted = false;

// 키움 API Python 스크립트 실행
function startKiwoomAPI() {
  console.log('키움증권 API 연결 시작...');
  
  const pythonScript = path.join(__dirname, 'kiwoom_api.py');
  kiwoomProcess = spawn('python', [pythonScript]);
  
  kiwoomProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('키움 API:', output);
    
    // 연결 성공 확인
    if (output.includes('키움증권 API 연결 성공')) {
      console.log('✅ 키움증권 API 연결 완료');
    }
    
    // 로그인 성공 확인
    if (output.includes('키움증권 로그인 성공')) {
      kiwoomConnected = true;
      console.log('✅ 키움증권 로그인 완료');
    }
    
    // 로그인 실패 확인
    if (output.includes('키움증권 로그인 실패')) {
      kiwoomConnected = false;
      console.log('❌ 키움증권 로그인 실패');
    }
  });
  
  kiwoomProcess.stderr.on('data', (data) => {
    console.error('키움 API 오류:', data.toString());
  });
  
  kiwoomProcess.on('close', (code) => {
    console.log('키움 API 프로세스 종료:', code);
    kiwoomConnected = false;
  });
}

// 로그인 API
app.post('/api/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    console.log('로그인 시도:', { userId, password });
    
    // 키움 API 연결 시작 (한 번만)
    if (!loginAttempted) {
      startKiwoomAPI();
      loginAttempted = true;
      
      // Python 스크립트가 실행될 시간을 줌
      setTimeout(() => {
        console.log('키움 API 초기화 완료');
      }, 3000);
    }
    
    // 실제 로그인은 Python 스크립트에서 처리됨
    res.json({
      success: true,
      message: '로그인 요청 처리 중입니다. 잠시 후 다시 시도해주세요.',
      sessionId: 'session_' + Date.now(),
      userId: userId
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다'
    });
  }
});

// 조건검색 결과 API
app.post('/api/condition/result', async (req, res) => {
  try {
    const { conditionIndex } = req.body;
    
    console.log('조건검색 요청:', { conditionIndex });
    
    if (!kiwoomConnected) {
      return res.status(503).json({
        success: false,
        message: '키움증권 API가 연결되지 않았습니다. HTS가 실행 중이고 로그인되어 있는지 확인해주세요.'
      });
    }
    
    // 실제 조건검색 결과는 Python 스크립트에서 처리
    // 임시로 샘플 데이터 반환
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
  } catch (error) {
    console.error('조건검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '조건검색 결과를 가져오는 중 오류가 발생했습니다'
    });
  }
});

// 서버 상태 확인 API
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    kiwoomConnected: kiwoomConnected,
    loginAttempted: loginAttempted,
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 실제 키움증권 API 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}`);
  console.log(`🔗 상태 확인: http://localhost:${PORT}/api/status`);
  console.log(`⚠️  실제 키움 HTS가 실행 중이고 로그인되어 있어야 합니다!`);
});

// 프로세스 종료 시 키움 API도 함께 종료
process.on('SIGINT', () => {
  console.log('서버를 종료합니다...');
  if (kiwoomProcess) {
    kiwoomProcess.kill();
  }
  process.exit(0);
}); 