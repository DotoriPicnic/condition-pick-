import React, { useState, useEffect } from 'react';

const AdvancedConditionView = () => {
  const [advancedResult, setAdvancedResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAdvancedConditionResult = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/condition/advanced/result');
      const result = await response.json();

      if (result.success) {
        setAdvancedResult(result.data);
        setLastUpdate(new Date(result.lastUpdate));
      } else {
        setError(result.message || '고급 조건검색 결과를 가져올 수 없습니다.');
      }
    } catch (err) {
      setError('서버 연결 오류: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const runAdvancedConditionSearch = async () => {
    setIsSearching(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/condition/advanced/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (result.success) {
        setAdvancedResult(result);
        setLastUpdate(new Date());
        // 결과를 다시 가져오기
        setTimeout(() => {
          fetchAdvancedConditionResult();
        }, 1000);
      } else {
        setError(result.error || '고급 조건검색 실행 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('서버 연결 오류: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // 컴포넌트 마운트 시 자동으로 데이터 가져오기
  useEffect(() => {
    // 페이지 로드 시 자동으로 고급 조건검색 실행
    runAdvancedConditionSearch();
  }, []);

  // 5분마다 자동 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && !isSearching) {
        fetchAdvancedConditionResult();
      }
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [isLoading, isSearching]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
                     <h2 className="text-2xl font-bold text-gray-900">고급 조건검색 결과</h2>
           <p className="text-sm text-gray-600 mt-1">
             꼬리우상향 + 바닥2회 조건을 만족하는 종목들
           </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchAdvancedConditionResult}
            disabled={isLoading || isSearching}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
              isLoading || isSearching
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                새로고침 중...
              </div>
            ) : (
              '새로고침'
            )}
          </button>
          <button
            onClick={runAdvancedConditionSearch}
            disabled={isSearching}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
              isSearching
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isSearching ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                검색 중...
              </div>
            ) : (
              '조건검색 실행'
            )}
          </button>
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 결과 */}
      {advancedResult && (
        <div className="space-y-4">
          {/* 검색 정보 */}
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-purple-900">
                  고급 조건검색 결과
                </h3>
                <p className="text-sm text-purple-700">
                  조건식: {advancedResult.condition_name}
                </p>
                <p className="text-sm text-purple-700">
                  검색된 종목 수: {advancedResult.count}개
                </p>
                                 <div className="mt-2 text-xs text-purple-600">
                   <p>🔍 조건 1: 일봉에서 꼬리 우상향 패턴 (시가 &lt; 종가, 꼬리 길이 ≥ 30%)</p>
                   <p>🔍 조건 2: 최근 20일 기준 바닥 2회 출현 (±2%)</p>
                 </div>
                <p className="text-xs text-purple-600 mt-1">
                  💡 5분마다 자동으로 업데이트됩니다
                </p>
              </div>
              {lastUpdate && (
                <div className="text-right">
                  <p className="text-xs text-purple-600">
                    마지막 업데이트
                  </p>
                  <p className="text-xs text-purple-600">
                    {lastUpdate.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 종목 목록 */}
          {advancedResult.result && advancedResult.result.length > 0 ? (
            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">추천 종목 목록</h4>
              <div className="grid gap-3">
                {advancedResult.result.map((stock, index) => (
                  <div
                    key={stock.code}
                    className="bg-white rounded-md p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">
                            {stock.name}
                          </h5>
                          <p className="text-xs text-gray-500">
                            종목코드: {stock.code}
                          </p>
                          <p className="text-xs text-gray-500">
                            현재가: {stock.price?.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          고급추천
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-yellow-800 font-medium">📊 조건을 만족하는 종목이 없습니다</p>
                <p className="text-yellow-600 text-sm mt-2">
                  현재 설정된 고급 필터링 조건을 만족하는 종목이 없습니다.
                </p>
                                 <p className="text-yellow-500 text-xs mt-3">
                   • 꼬리 우상향 패턴이 부족하거나<br/>
                   • 바닥 2회 출현 조건을 만족하지 않을 수 있습니다.
                 </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && !advancedResult && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">고급 조건검색 결과를 불러오는 중...</p>
        </div>
      )}

      {/* 검색 중 상태 */}
      {isSearching && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">고급 조건검색을 실행하는 중...</p>
                     <p className="text-sm text-gray-400 mt-1">
             키움 API를 통해 일봉 데이터를 분석하고 있습니다.
           </p>
        </div>
      )}
    </div>
  );
};

export default AdvancedConditionView; 