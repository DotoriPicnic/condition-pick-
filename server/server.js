const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 키움증권 HTS 연동 상태
let isHTSConnected = true; // 즉시 연결 상태로 변경
let htsSession = {
  userId: 'demo_user',
  connectedAt: new Date(),
  sessionId: 'hts_session_' + Date.now()
};

// 샘플 조건검색 데이터 (실제로는 HTS에서 가져옴)
const sampleConditionData = [
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
  },
  {
    종목명: "NAVER",
    종목코드: "035420",
    현재가: 245000,
    등락폭: 5000,
    등락률: 2.08,
    거래량: 3000000,
    거래대금: 735000000000
  },
  {
    종목명: "카카오",
    종목코드: "035720",
    현재가: 52000,
    등락폭: -1000,
    등락률: -1.89,
    거래량: 12000000,
    거래대금: 624000000000
  }
];

// HTS 연결 시뮬레이션
function simulateHTSConnection() {
  console.log('HTS 연결 시뮬레이션 시작...');
  setTimeout(() => {
    isHTSConnected = true;
    htsSession = {
      userId: 'demo_user',
      connectedAt: new Date(),
      sessionId: 'hts_session_' + Date.now()
    };
    console.log('HTS 연결 성공:', htsSession);
  }, 2000);
}

// 로그인 API
app.post('/api/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    console.log('로그인 시도:', { userId, password });
    
    // 실제 HTS 로그인 로직 (여기서는 시뮬레이션)
    if (userId && password) {
      // HTS 연결 시뮬레이션
      simulateHTSConnection();
      
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
    
    // HTS 연결 확인
    if (!isHTSConnected) {
      return res.status(503).json({
        success: false,
        message: 'HTS가 연결되지 않았습니다. 잠시 후 다시 시도해주세요.'
      });
    }
    
    // 조건검색 인덱스에 따른 데이터 반환 (시뮬레이션)
    let resultData = [...sampleConditionData];
    
    // 조건검색 인덱스에 따라 데이터 필터링 (시뮬레이션)
    if (conditionIndex === 1) {
      resultData = resultData.filter(item => item.등락률 > 0);
    } else if (conditionIndex === 2) {
      resultData = resultData.filter(item => item.등락률 < 0);
    } else if (conditionIndex === 3) {
      resultData = resultData.filter(item => item.거래량 > 10000000);
    }
    
    // 실제 가격 업데이트 (시뮬레이션)
    resultData = resultData.map(item => ({
      ...item,
      현재가: item.현재가 + Math.floor(Math.random() * 1000 - 500),
      등락폭: Math.floor(Math.random() * 2000 - 1000),
      등락률: parseFloat((Math.random() * 4 - 2).toFixed(2))
    }));
    
    res.json(resultData);
  } catch (error) {
    console.error('조건검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '조건검색 결과를 가져오는 중 오류가 발생했습니다'
    });
  }
});

// 실시간 데이터 구독 API
app.post('/api/stock/realtime', async (req, res) => {
  try {
    const { stockCodes } = req.body;
    
    console.log('실시간 데이터 구독:', { stockCodes });
    
    // HTS 연결 확인
    if (!isHTSConnected) {
      return res.status(503).json({
        success: false,
        message: 'HTS가 연결되지 않았습니다'
      });
    }
    
    res.json({
      success: true,
      message: '실시간 데이터 구독 성공',
      subscribedCodes: stockCodes
    });
  } catch (error) {
    console.error('실시간 데이터 구독 오류:', error);
    res.status(500).json({
      success: false,
      message: '실시간 데이터 구독 중 오류가 발생했습니다'
    });
  }
});

// 주식 데이터 API
app.post('/api/stock/data', async (req, res) => {
  try {
    const { stockCodes } = req.body;
    
    console.log('주식 데이터 요청:', { stockCodes });
    
    // HTS 연결 확인
    if (!isHTSConnected) {
      return res.status(503).json({
        success: false,
        message: 'HTS가 연결되지 않았습니다'
      });
    }
    
    // 요청된 종목코드에 대한 데이터 반환
    const resultData = sampleConditionData.filter(item => 
      stockCodes.includes(item.종목코드)
    );
    
    res.json(resultData);
  } catch (error) {
    console.error('주식 데이터 오류:', error);
    res.status(500).json({
      success: false,
      message: '주식 데이터를 가져오는 중 오류가 발생했습니다'
    });
  }
});

// 서버 상태 확인 API
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    htsConnected: isHTSConnected,
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 키움증권 API 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}`);
  console.log(`🔗 상태 확인: http://localhost:${PORT}/api/status`);
});

// WebSocket 서버 (실시간 데이터용)
const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', (ws) => {
  console.log('WebSocket 클라이언트 연결됨');
  
  // 실시간 데이터 전송 (시뮬레이션)
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const realtimeData = sampleConditionData.map(item => ({
        ...item,
        현재가: item.현재가 + Math.floor(Math.random() * 100 - 50),
        timestamp: new Date().toISOString()
      }));
      
      ws.send(JSON.stringify({
        type: 'realtime',
        data: realtimeData
      }));
    }
  }, 5000); // 5초마다 업데이트
  
  ws.on('close', () => {
    console.log('WebSocket 클라이언트 연결 해제');
    clearInterval(interval);
  });
});

console.log('🔌 WebSocket 서버가 포트 8081에서 실행 중입니다'); 