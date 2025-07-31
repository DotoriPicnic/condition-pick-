import React, { useState, useEffect, useRef } from 'react';

const StockListView = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);
  const isPageVisible = useRef(true);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://raw.githubusercontent.com/DotoriPicnic/condition-pick-/main/data.json');
      
      if (!response.ok) {
        throw new Error('데이터를 불러올 수 없습니다');
      }
      
      const data = await response.json();
      setStocks(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (isPageVisible.current) {
        fetchStocks();
      }
    }, 5000); // 5초
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 페이지 가시성 변경 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
      
      if (isPageVisible.current) {
        // 페이지가 다시 보이면 즉시 데이터 새로고침
        fetchStocks();
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
  }, []);

  // 컴포넌트 마운트 시 초기 데이터 로드 및 자동 새로고침 시작
  useEffect(() => {
    fetchStocks();
    startAutoRefresh();

    return () => {
      stopAutoRefresh();
    };
  }, []);

  if (loading && stocks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchStocks}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">조건을 만족하는 종목이 없습니다</h2>
          <p className="text-gray-600">현재 필터링 조건에 맞는 종목이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            조건 만족 종목 리스트
          </h1>
          <p className="text-gray-600 mb-2">
            필터링 조건을 만족하는 {stocks.length}개 종목
          </p>
          {lastUpdate && (
            <p className="text-gray-500 text-sm">
              마지막 업데이트: {lastUpdate.toLocaleString('ko-KR')}
            </p>
          )}
          <div className="flex items-center justify-center mt-2 space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 text-sm font-medium">자동 새로고침 활성화 (5초마다)</span>
          </div>
        </div>

        {/* 수동 새로고침 버튼 */}
        <div className="text-center mb-6">
          <button 
            onClick={fetchStocks}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center mx-auto space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>새로고침 중...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>수동 새로고침</span>
              </>
            )}
          </button>
        </div>

        {/* 종목 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stocks.map((stock, index) => (
            <div
              key={`${stock.code}-${index}`}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
            >
              {/* 카드 헤더 */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <h3 className="text-white font-semibold text-lg truncate">
                  {stock.name}
                </h3>
                <p className="text-indigo-100 text-sm font-mono">
                  {stock.code}
                </p>
              </div>

              {/* 카드 바디 */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 text-sm font-medium">현재가</span>
                  <span className="text-2xl font-bold text-gray-800">
                    {stock.price.toLocaleString()}원
                  </span>
                </div>

                {/* 가격 변화 표시 (샘플) */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-sm">등락률</span>
                  <span className="text-green-600 font-semibold text-sm">
                    +2.5%
                  </span>
                </div>

                {/* 거래량 (샘플) */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-sm">거래량</span>
                  <span className="text-gray-700 font-medium text-sm">
                    {Math.floor(Math.random() * 1000 + 100)}K
                  </span>
                </div>

                {/* 액션 버튼 */}
                <div className="pt-4 border-t border-gray-100">
                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm">
                    상세보기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>페이지가 백그라운드 상태일 때는 자동 새로고침이 일시 중지됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default StockListView; 