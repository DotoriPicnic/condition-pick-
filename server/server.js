const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
app.use(cors());
app.use(express.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, '../build')));

// 키움증권 조건검색 API 상태
let kiwoomConditionStatus = {
  isRunning: false,
  lastResult: null,
  lastUpdate: null,
  error: null
};

// 자동 조건검색 결과 저장
let autoConditionResult = {
  lastUpdate: null,
  result: null,
  isAutoRunning: false
};

// 자동 조건검색 시작 (서버 시작 시)
function startAutoConditionSearch() {
  if (autoConditionResult.isAutoRunning) return;
  
  autoConditionResult.isAutoRunning = true;
  console.log('🔄 자동 조건검색 시작 (5분마다)');
  
  // 즉시 한 번 실행
  runAutoConditionSearch();
  
  // 5분마다 자동 실행
  setInterval(() => {
    runAutoConditionSearch();
  }, 5 * 60 * 1000); // 5분
}

// 자동 조건검색 실행
async function runAutoConditionSearch() {
  try {
    console.log('🔄 자동 조건검색 실행 중...');
    
    // Python 스크립트 실행 (기존 조건검색)
    const pythonScript = path.join(__dirname, 'kiwoom_condition_api.py');
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    const env = { ...process.env };
    env.PYTHONPATH = path.join(__dirname);
    env.PYTHONIOENCODING = 'utf-8';
    env.LANG = 'ko_KR.UTF-8';
    
    const pythonProcess = spawn(pythonCommand, [pythonScript], { 
      env: env,
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (result.trim()) {
        try {
          const searchResult = JSON.parse(result.trim());
          autoConditionResult.result = searchResult;
          autoConditionResult.lastUpdate = new Date();
          
          // 결과를 파일에 저장
          const resultPath = path.join(__dirname, 'auto_condition_result.json');
          fs.writeFileSync(resultPath, JSON.stringify(searchResult, null, 2), 'utf8');
          
          console.log('✅ 자동 조건검색 완료:', searchResult.count, '개 종목');
        } catch (parseError) {
          console.log('❌ 자동 조건검색 파싱 오류:', parseError);
        }
      } else {
        console.log('❌ 자동 조건검색 실패:', error);
      }
    });

  } catch (error) {
    console.log('❌ 자동 조건검색 오류:', error);
  }
}

// 고급 조건검색 실행 (꼬리우상향, 바닥2회, 상승장)
async function runAdvancedConditionSearch() {
  try {
    console.log('🔍 고급 조건검색 실행 중...');
    
    // Python 스크립트 실행 (새로운 고급 조건검색)
    const pythonScript = path.join(__dirname, 'kiwoom_advanced_filter.py');
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    const env = { ...process.env };
    env.PYTHONPATH = path.join(__dirname);
    env.PYTHONIOENCODING = 'utf-8';
    env.LANG = 'ko_KR.UTF-8';
    
    const pythonProcess = spawn(pythonCommand, [pythonScript], { 
      env: env,
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    return new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (result.trim()) {
          try {
            // JSON 결과 부분만 추출
            const jsonStart = result.indexOf('JSON_RESULT_START');
            const jsonEnd = result.indexOf('JSON_RESULT_END');
            
            if (jsonStart !== -1 && jsonEnd !== -1) {
              const jsonContent = result.substring(jsonStart + 17, jsonEnd).trim();
              const searchResult = JSON.parse(jsonContent);
              console.log('✅ 고급 조건검색 완료:', searchResult.count, '개 종목');
              resolve(searchResult);
            } else {
              // 기존 방식으로 시도
              const searchResult = JSON.parse(result.trim());
              console.log('✅ 고급 조건검색 완료:', searchResult.count, '개 종목');
              resolve(searchResult);
            }
          } catch (parseError) {
            console.log('❌ 고급 조건검색 파싱 오류:', parseError);
            console.log('원본 출력:', result);
            reject(new Error('결과 파싱 오류: ' + parseError.message));
          }
        } else {
          console.log('❌ 고급 조건검색 실패:', error);
          reject(new Error('조건검색 실행 실패: ' + error));
        }
      });
    });

  } catch (error) {
    console.log('❌ 고급 조건검색 오류:', error);
    throw error;
  }
}

// 키움증권 HTS 연동 상태 (시뮬레이션)
let isHTSConnected = true;
let htsSession = {
  userId: 'demo_user',
  connectedAt: new Date(),
  sessionId: 'hts_session_' + Date.now()
};

// 실시간 데이터 시뮬레이션을 위한 변수
let realtimeData = {
  lastUpdate: new Date(),
  updateInterval: null
};

// 샘플 조건검색 데이터 (실제로는 HTS에서 가져옴)
const baseConditionData = [
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
  },
  {
    종목명: "LG에너지솔루션",
    종목코드: "373220",
    현재가: 485000,
    등락폭: 15000,
    등락률: 3.19,
    거래량: 2000000,
    거래대금: 970000000000
  },
  {
    종목명: "현대차",
    종목코드: "005380",
    현재가: 185000,
    등락폭: -3000,
    등락률: -1.60,
    거래량: 5000000,
    거래대금: 925000000000
  }
];

// 실시간 데이터 업데이트 함수
function updateRealtimeData() {
  baseConditionData.forEach(stock => {
    // 가격 변동 시뮬레이션 (-2% ~ +2%)
    const priceChange = Math.floor(Math.random() * 4000 - 2000);
    const newPrice = stock.현재가 + priceChange;
    
    // 등락폭과 등락률 계산
    const change = newPrice - stock.현재가;
    const changeRate = ((change / stock.현재가) * 100);
    
    // 거래량 변동 시뮬레이션
    const volumeChange = Math.floor(Math.random() * 2000000 - 1000000);
    const newVolume = Math.max(1000000, stock.거래량 + volumeChange);
    
    // 데이터 업데이트
    stock.현재가 = newPrice;
    stock.등락폭 = change;
    stock.등락률 = parseFloat(changeRate.toFixed(2));
    stock.거래량 = newVolume;
    stock.거래대금 = newPrice * newVolume;
  });
  
  realtimeData.lastUpdate = new Date();
}

// 실시간 데이터 업데이트 시작 (30초마다)
function startRealtimeUpdates() {
  if (realtimeData.updateInterval) {
    clearInterval(realtimeData.updateInterval);
  }
  
  realtimeData.updateInterval = setInterval(() => {
    updateRealtimeData();
    console.log(`실시간 데이터 업데이트: ${realtimeData.lastUpdate.toLocaleTimeString()}`);
  }, 30000); // 30초마다 업데이트
}

// 조건검색 목록 (시뮬레이션)
const conditionList = [
  { index: 0, name: "전체 조건검색" },
  { index: 1, name: "상승 종목" },
  { index: 2, name: "하락 종목" },
  { index: 3, name: "거래량 상위" },
  { index: 4, name: "시가총액 상위" }
];

// 로그인 API
app.post('/api/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    console.log('로그인 시도:', { userId, password });
    
    // 실제 HTS 로그인 로직 (여기서는 시뮬레이션)
    if (userId && password) {
      // HTS 연결 시뮬레이션
      setTimeout(() => {
        isHTSConnected = true;
        htsSession = {
          userId: userId,
          connectedAt: new Date(),
          sessionId: 'hts_session_' + Date.now()
        };
        console.log('HTS 연결 성공:', htsSession);
        
        // 실시간 데이터 업데이트 시작
        startRealtimeUpdates();
      }, 1000);
      
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

// 조건검색 목록 가져오기
app.get('/api/condition/list', (req, res) => {
  try {
    res.json({
      success: true,
      data: conditionList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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
    let resultData = [...baseConditionData];
    
    // 조건검색 인덱스에 따라 데이터 필터링 (시뮬레이션)
    if (conditionIndex === 1) {
      resultData = resultData.filter(item => item.등락률 > 0);
    } else if (conditionIndex === 2) {
      resultData = resultData.filter(item => item.등락률 < 0);
    } else if (conditionIndex === 3) {
      resultData = resultData.filter(item => item.거래량 > 10000000);
    } else if (conditionIndex === 4) {
      resultData = resultData.sort((a, b) => b.거래대금 - a.거래대금);
    }
    
    res.json({
      success: true,
      data: resultData,
      conditionIndex: conditionIndex,
      lastUpdate: realtimeData.lastUpdate.toISOString(),
      isRealtime: true
    });
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
      subscribedCodes: stockCodes,
      updateInterval: '30초'
    });
  } catch (error) {
    console.error('실시간 데이터 구독 오류:', error);
    res.status(500).json({
      success: false,
      message: '실시간 데이터 구독 중 오류가 발생했습니다'
    });
  }
});

// 실시간 데이터 상태 확인 API
app.get('/api/realtime/status', (req, res) => {
  res.json({
    isActive: !!realtimeData.updateInterval,
    lastUpdate: realtimeData.lastUpdate.toISOString(),
    updateInterval: '30초',
    connectedStocks: baseConditionData.length
  });
});

// 서버 상태 확인 API
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    htsConnected: isHTSConnected,
    realtimeActive: !!realtimeData.updateInterval,
    kiwoomCondition: kiwoomConditionStatus,
    timestamp: new Date().toISOString()
  });
});

// 키움증권 조건검색 실행
app.post('/api/condition/search', async (req, res) => {
  try {
    if (kiwoomConditionStatus.isRunning) {
      return res.json({
        success: false,
        error: '조건검색이 이미 실행 중입니다.'
      });
    }

    kiwoomConditionStatus.isRunning = true;
    kiwoomConditionStatus.error = null;

    console.log('🔍 조건검색 실행 시작...');

    // Python 스크립트 실행
    const pythonScript = path.join(__dirname, 'kiwoom_condition_api.py');
    console.log('📁 Python 스크립트 경로:', pythonScript);
    
    // Python 실행 경로 설정 (Windows)
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    console.log('🐍 Python 명령어:', pythonCommand);
    
    // 환경 변수 설정
    const env = { ...process.env };
    env.PYTHONPATH = path.join(__dirname);
    env.PYTHONIOENCODING = 'utf-8';
    env.LANG = 'ko_KR.UTF-8';
    console.log('🔧 환경 변수 설정됨');
    
    const pythonProcess = spawn(pythonCommand, [pythonScript], { 
      env: env,
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log('🚀 Python 프로세스 시작됨');

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📤 Python 출력:', output);
      result += output;
    });

    pythonProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      console.log('❌ Python 오류:', errorOutput);
      error += errorOutput;
    });

    pythonProcess.on('close', (code) => {
      console.log('🔚 Python 프로세스 종료, 코드:', code);
      kiwoomConditionStatus.isRunning = false;
      kiwoomConditionStatus.lastUpdate = new Date();

      // 결과가 있으면 성공으로 처리 (종료 코드 무시)
      if (result.trim()) {
        try {
          console.log('📋 파싱할 결과:', result.trim());
          const searchResult = JSON.parse(result.trim());
          kiwoomConditionStatus.lastResult = searchResult;
          console.log('✅ 조건검색 성공:', searchResult);
          res.json(searchResult);
        } catch (parseError) {
          console.log('❌ JSON 파싱 오류:', parseError);
          kiwoomConditionStatus.error = '결과 파싱 오류';
          res.json({
            success: false,
            error: '결과 파싱 오류: ' + parseError.message,
            rawResult: result.trim()
          });
        }
      } else {
        console.log('❌ Python 실행 실패, 코드:', code, '오류:', error);
        kiwoomConditionStatus.error = error || '조건검색 실행 실패';
        res.json({
          success: false,
          error: error || '조건검색 실행 실패',
          exitCode: code
        });
      }
    });

    pythonProcess.on('error', (err) => {
      console.log('❌ Python 프로세스 오류:', err);
      kiwoomConditionStatus.isRunning = false;
      kiwoomConditionStatus.error = err.message;
      res.json({
        success: false,
        error: 'Python 스크립트 실행 오류: ' + err.message
      });
    });

  } catch (error) {
    console.log('❌ 서버 오류:', error);
    kiwoomConditionStatus.isRunning = false;
    kiwoomConditionStatus.error = error.message;
    res.json({
      success: false,
      error: '서버 오류: ' + error.message
    });
  }
});

// 키움증권 조건검색 상태 확인
app.get('/api/condition/status', (req, res) => {
  res.json(kiwoomConditionStatus);
});

// 자동 조건검색 결과 가져오기
app.get('/api/condition/auto/result', (req, res) => {
  try {
    // 자동 조건검색이 실행되지 않았다면 즉시 실행
    if (!autoConditionResult.isAutoRunning) {
      console.log('🔄 자동 조건검색이 시작되지 않음. 즉시 시작...');
      startAutoConditionSearch();
    }
    
    if (autoConditionResult.lastUpdate) {
      res.json({
        success: true,
        data: autoConditionResult.result,
        lastUpdate: autoConditionResult.lastUpdate.toISOString()
      });
    } else {
      // 결과가 없으면 수동으로 한 번 실행
      console.log('🔄 자동 조건검색 결과가 없음. 수동 실행...');
      runAutoConditionSearch().then(() => {
        if (autoConditionResult.lastUpdate) {
          res.json({
            success: true,
            data: autoConditionResult.result,
            lastUpdate: autoConditionResult.lastUpdate.toISOString()
          });
        } else {
          res.json({
            success: false,
            message: '조건검색을 실행 중입니다. 잠시 후 다시 시도해주세요.'
          });
        }
      }).catch(error => {
        res.json({
          success: false,
          message: '조건검색 실행 중 오류가 발생했습니다: ' + error.message
        });
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 고급 조건검색 실행 API
app.post('/api/condition/advanced/search', async (req, res) => {
  try {
    console.log('🔍 고급 조건검색 요청 받음...');
    
    const result = await runAdvancedConditionSearch();
    
    res.json(result);
  } catch (error) {
    console.log('❌ 고급 조건검색 오류:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// 고급 조건검색 결과 가져오기 (data.json에서)
app.get('/api/condition/advanced/result', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../data.json');
    
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      const stocks = JSON.parse(data);
      
      res.json({
        success: true,
        data: {
          condition_name: "꼬리우상향_바닥2회_상승장",
          count: stocks.length,
          result: stocks
        },
        lastUpdate: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        message: '고급 조건검색 결과가 없습니다. 먼저 조건검색을 실행해주세요.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 삼성전자 일봉 데이터 API (기존 유지)
app.get('/api/samsung-daily', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../samsung_daily.json');
    
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      const stockData = JSON.parse(data);
      res.json({
        success: true,
        data: stockData,
        lastUpdate: new Date().toISOString()
      });
    } else {
      // 파일이 없으면 샘플 데이터 반환
      const sampleData = generateSampleData();
      res.json({
        success: true,
        data: sampleData,
        lastUpdate: new Date().toISOString(),
        note: '샘플 데이터입니다. 실제 데이터를 수집하려면 stock_filter.py를 실행하세요.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 주식 목록 API (기존 data.json)
app.get('/api/stocks', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../data.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    const stocks = JSON.parse(data);
    res.json({
      success: true,
      data: stocks,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 샘플 데이터 생성 함수
function generateSampleData() {
  const sampleData = [];
  const basePrice = 87000;
  
  for (let i = 0; i < 20; i++) {
    const date = `202412${20-i < 10 ? '0' + (20-i) : 20-i}`;
    const openPrice = basePrice + (i * 100);
    const highPrice = openPrice + 500;
    const lowPrice = openPrice - 300;
    const closePrice = openPrice + 200;
    const volume = 1000000 + (i * 50000);
    
    sampleData.push({
      date: date,
      open: openPrice,
      high: highPrice,
      low: lowPrice,
      close: closePrice,
      volume: volume
    });
  }
  
  return sampleData;
}

// React 앱의 모든 라우트를 index.html로 리다이렉트
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`API 엔드포인트:`);
  console.log(`- POST /api/login: 키움증권 로그인`);
  console.log(`- GET /api/condition/list: 조건검색 목록`);
  console.log(`- POST /api/condition/result: 조건검색 결과`);
  console.log(`- POST /api/stock/realtime: 실시간 데이터 구독`);
  console.log(`- GET /api/realtime/status: 실시간 데이터 상태`);
  console.log(`- GET /api/status: 서버 상태 확인`);
  console.log(`- GET /api/condition/auto/result: 자동 조건검색 결과`);
  console.log(`- GET /api/samsung-daily: 삼성전자 일봉 데이터`);
  console.log(`- GET /api/stocks: 주식 목록 데이터`);
  console.log(`\n실시간 데이터 업데이트: 30초마다 자동 업데이트`);
  
  // 자동 조건검색 시작
  startAutoConditionSearch();
}); 