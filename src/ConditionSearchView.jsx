import React, { useState, useEffect } from 'react';

const ConditionSearchView = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // 조건검색 실행
  const runConditionSearch = async () => {
    setIsLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/condition/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setSearchResult(result);
        setLastUpdate(new Date());
      } else {
        setError(result.error || '조건검색 실행 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('서버 연결 오류: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 자동 새로고침 (5분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        runConditionSearch();
      }
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">키움증권 조건검색</h2>
        <button
          onClick={runConditionSearch}
          disabled={isLoading}
          className={`px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
            isLoading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              검색 중...
            </div>
          ) : (
            '조건검색 실행'
          )}
        </button>
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
      {searchResult && (
        <div className="space-y-4">
          {/* 검색 정보 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  조건검색 결과
                </h3>
                <p className="text-sm text-blue-700">
                  조건식: {searchResult.condition_name}
                </p>
                <p className="text-sm text-blue-700">
                  검색된 종목 수: {searchResult.count}개
                </p>
              </div>
              {lastUpdate && (
                <div className="text-right">
                  <p className="text-xs text-blue-600">
                    마지막 업데이트
                  </p>
                  <p className="text-xs text-blue-600">
                    {lastUpdate.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 종목 목록 */}
          {searchResult.result && searchResult.result.length > 0 ? (
            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">검색된 종목</h4>
              <div className="grid gap-3">
                {searchResult.result.map((stock, index) => (
                  <div
                    key={stock.code}
                    className="bg-white rounded-md p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
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
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`https://finance.naver.com/item/main.naver?code=${stock.code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          네이버 금융
                        </a>
                        <a
                          href={`https://m.stock.naver.com/item/${stock.code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:text-green-800"
                        >
                          모바일
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    검색 결과 없음
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    현재 조건식에 해당하는 종목이 없습니다.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 안내 메시지 */}
      {!searchResult && !error && !isLoading && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">조건검색 준비</h3>
          <p className="mt-1 text-sm text-gray-500">
            "조건검색 실행" 버튼을 클릭하여 키움증권 조건검색을 시작하세요.
          </p>
          <div className="mt-6">
            <button
              onClick={runConditionSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              조건검색 실행
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionSearchView; 