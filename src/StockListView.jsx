import React, { useState, useEffect, useRef, useCallback } from 'react';
import KiwoomAPI from './kiwoomApi';

const StockListView = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // 자동 로그인 상태로 시작
  const [conditionIndex, setConditionIndex] = useState(0);
  const [conditionList, setConditionList] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState({ index: 0, name: "전체 조건검색" });
  const intervalRef = useRef(null);
  const isPageVisible = useRef(true);
  const kiwoomApi = useRef(new KiwoomAPI());

  // 조건검색 결과 가져오기
  const fetchConditionResult = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await kiwoomApi.current.getConditionResult(conditionIndex);
      
      // 키움증권 API 응답 형식에 맞게 데이터 변환
      const stockData = result.map(item => ({
        name: item.종목명 || item.name || '알 수 없음',
        code: item.종목코드 || item.code || '000000',
        price: parseInt(item.현재가 || item.price) || 0,
        change: parseInt(item.등락폭 || item.change) || 0,
        changeRate: parseFloat(item.등락률 || item.changeRate) || 0.0,
        volume: parseInt(item.거래량 || item.volume) || 0,
        amount: parseInt(item.거래대금 || item.amount) || 0
      }));
      
      setStocks(stockData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(`조건검색 결과를 가져올 수 없습니다: ${err.message}`);
      // API 오류 시 기존 data.json 사용 (폴백)
      try {
        const response = await fetch('https://raw.githubusercontent.com/DotoriPicnic/condition-pick-/main/data.json');
        if (response.ok) {
          const data = await response.json();
          setStocks(data);
          setLastUpdate(new Date());
        }
      } catch (fallbackErr) {
        setError(`데이터를 불러올 수 없습니다: ${fallbackErr.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [conditionIndex]);

  // 조건검색 목록 가져오기
  const fetchConditionList = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/condition/list');
      const result = await response.json();
      
      if (result.success) {
        setConditionList(result.data);
        if (result.data.length > 0) {
          setSelectedCondition(result.data[0]);
          setConditionIndex(result.data[0].index);
        }
      }
    } catch (err) {
      console.error('조건검색 목록 로딩 실패:', err);
      // 기본 조건검색 목록 설정
      const defaultConditions = [
        { index: 0, name: "전체 조건검색" },
        { index: 1, name: "상승 종목" },
        { index: 2, name: "하락 종목" },
        { index: 3, name: "거래량 상위" },
        { index: 4, name: "시가총액 상위" }
      ];
      setConditionList(defaultConditions);
      setSelectedCondition(defaultConditions[0]);
    }
  }, []);

  // 자동 로그인 처리
  const handleAutoLogin = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 자동 로그인 (시뮬레이션)
      const result = await kiwoomApi.current.login('demo_user', 'demo_pass');
      setIsLoggedIn(true);
      console.log('자동 로그인 성공:', result);
      
      // 로그인 성공 후 조건검색 목록과 결과 가져오기
      await fetchConditionList();
      await fetchConditionResult();
    } catch (err) {
      setError(`자동 로그인 실패: ${err.message}`);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, [fetchConditionList, fetchConditionResult]);

  // 조건검색 변경 처리
  const handleConditionChange = useCallback((condition) => {
    setSelectedCondition(condition);
    setConditionIndex(condition.index);
  }, []);

  // 실시간 데이터 구독 (향후 사용 예정)
  // const subscribeRealTimeData = useCallback(async (stockCodes) => {
  //   try {
  //     await kiwoomApi.current.subscribeRealTimeData(stockCodes);
  //     console.log('실시간 데이터 구독 성공');
  //   } catch (err) {
  //     console.error('실시간 데이터 구독 실패:', err);
  //   }
  // }, []);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (isPageVisible.current && isLoggedIn) {
        fetchConditionResult();
      }
    }, 30000); // 30초 (실시간 데이터와 동기화)
  }, [fetchConditionResult, isLoggedIn]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 페이지 가시성 변경 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
      
      if (isPageVisible.current && isLoggedIn) {
        // 페이지가 다시 보이면 즉시 데이터 새로고침
        fetchConditionResult();
        startAutoRefresh();
      } else {
        // 페이지가 숨겨지면 자동 새로고침 중지
        stopAutoRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchConditionResult, startAutoRefresh, stopAutoRefresh, isLoggedIn]);

  // 컴포넌트 마운트 시 자동 로그인 및 데이터 로드
  useEffect(() => {
    handleAutoLogin();
  }, [handleAutoLogin]);

  // 컴포넌트 마운트 시 초기 데이터 로드 및 자동 새로고침 시작
  useEffect(() => {
    if (isLoggedIn) {
      fetchConditionResult();
      startAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [fetchConditionResult, startAutoRefresh, stopAutoRefresh, isLoggedIn]);

  // 조건검색 변경 시 결과 다시 가져오기
  useEffect(() => {
    if (isLoggedIn) {
      fetchConditionResult();
    }
  }, [conditionIndex, isLoggedIn, fetchConditionResult]);

  if (loading && stocks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">실시간 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchConditionResult}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">실시간 조건검색 결과</h2>
          <p className="text-gray-600">
            {selectedCondition.name} - {stocks.length}개 종목
          </p>
          {lastUpdate && (
            <p className="text-sm text-gray-500">
              마지막 업데이트: {lastUpdate.toLocaleString('ko-KR')}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
          {/* 조건검색 선택 */}
          <div className="relative">
            <select
              value={selectedCondition.index}
              onChange={(e) => {
                const condition = conditionList.find(c => c.index === parseInt(e.target.value));
                if (condition) {
                  handleConditionChange(condition);
                }
              }}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {conditionList.map((condition) => (
                <option key={condition.index} value={condition.index}>
                  {condition.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
          
          {/* 새로고침 버튼 */}
          <button 
            onClick={fetchConditionResult}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                새로고침 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
              </>
            )}
          </button>
        </div>
      </div>

      {/* 자동 새로고침 상태 */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
        <span className="text-green-600 text-sm font-medium">실시간 데이터 활성화 (30초마다 업데이트)</span>
      </div>

      {/* 종목 리스트 */}
      {stocks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">조건을 만족하는 종목이 없습니다</h3>
          <p className="text-gray-600">현재 선택된 조건에 맞는 종목이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  종목명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  종목코드
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현재가
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등락폭
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등락률
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래량
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래대금
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stocks.map((stock, index) => (
                <tr key={`${stock.code}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stock.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {stock.code || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {stock.price ? stock.price.toLocaleString() : 'N/A'}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={stock.change > 0 ? 'text-red-600' : stock.change < 0 ? 'text-blue-600' : 'text-gray-500'}>
                      {stock.change > 0 ? '+' : ''}{stock.change ? stock.change.toLocaleString() : 'N/A'}원
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={stock.changeRate > 0 ? 'text-red-600' : stock.changeRate < 0 ? 'text-blue-600' : 'text-gray-500'}>
                      {stock.changeRate > 0 ? '+' : ''}{stock.changeRate ? stock.changeRate.toFixed(2) : 'N/A'}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {stock.volume ? (stock.volume / 1000).toFixed(0) + 'K' : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {stock.amount ? (stock.amount / 1000000).toFixed(0) + 'M' : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 푸터 */}
      <div className="text-center mt-6 text-gray-500 text-xs">
        <p>페이지가 백그라운드 상태일 때는 자동 새로고침이 일시 중지됩니다.</p>
        <p className="mt-1">실시간 데이터: 30초마다 자동 업데이트, 가격 변동 시뮬레이션</p>
      </div>
    </div>
  );
};

export default StockListView; 