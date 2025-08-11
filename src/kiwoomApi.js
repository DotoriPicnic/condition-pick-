// 키움증권 API 설정
const KIWOOM_CONFIG = {
  // API 서버 정보
  SERVER_URL: process.env.REACT_APP_KIWOOM_SERVER_URL || 'http://localhost:3001',
  
  // API 엔드포인트
  ENDPOINTS: {
    LOGIN: '/api/login',
    GET_STOCK_DATA: '/api/stock/data',
    GET_REAL_TIME_DATA: '/api/stock/realtime',
    GET_CONDITION_LIST: '/api/condition/list',
    GET_CONDITION_RESULT: '/api/condition/result'
  },
  
  // 요청 헤더
  HEADERS: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.REACT_APP_KIWOOM_API_KEY || ''}`
  }
};

// 키움증권 API 클래스
class KiwoomAPI {
  constructor() {
    this.SERVER_URL = 'http://localhost:3001'; // 실제 키움 API 서버
    this.isConnected = false;
  }

  async login(userId, password) {
    try {
      const response = await fetch(`${this.SERVER_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        this.isConnected = true;
        return data;
      } else {
        throw new Error(data.message || '로그인 실패');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  }

  async getConditionResult(conditionIndex) {
    try {
      const response = await fetch(`${this.SERVER_URL}/api/condition/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conditionIndex }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || '조건검색 실패');
      }
    } catch (error) {
      console.error('조건검색 오류:', error);
      throw error;
    }
  }

  async subscribeRealTimeData(stockCodes) {
    try {
      const response = await fetch(`${this.SERVER_URL}/api/stock/realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stockCodes }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || '실시간 데이터 구독 실패');
      }
    } catch (error) {
      console.error('실시간 데이터 구독 오류:', error);
      throw error;
    }
  }

  // 주식 데이터 가져오기
  async getStockData(stockCodes) {
    try {
      const response = await fetch(`${this.baseURL}${KIWOOM_CONFIG.ENDPOINTS.GET_STOCK_DATA}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ stockCodes })
      });
      
      if (!response.ok) {
        throw new Error('주식 데이터를 가져올 수 없습니다');
      }
      
      return await response.json();
    } catch (error) {
      console.error('주식 데이터 오류:', error);
      throw error;
    }
  }
}

export default KiwoomAPI;
export { KIWOOM_CONFIG }; 