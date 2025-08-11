import React, { useState, useEffect } from 'react';

const AutoConditionView = () => {
  const [autoResult, setAutoResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAutoConditionResult = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/condition/auto/result');
      const result = await response.json();
      
      if (result.success) {
        setAutoResult(result.data);
        setLastUpdate(new Date(result.lastUpdate));
      } else {
        setError(result.message || '자동 조건검색 결과를 가져올 수 없습니다.');
      }
    } catch (err) {
      setError('서버 연결 오류: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 자동으로 데이터 가져오기
  useEffect(() => {
    fetchAutoConditionResult();
  }, []);

  // 1분마다 자동 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchAutoConditionResult();
      }
    }, 60 * 1000); // 1분

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">자동 조건검색 결과</h2>
          <p className="text-sm text-gray-600 mt-1">
            로그인 없이 실시간 조건검색 결과를 확인할 수 있습니다
          </p>
        </div>
        <button
          onClick={fetchAutoConditionResult}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
            isLoading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
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
      {autoResult && (
        <div className="space-y-4">
          {/* 검색 정보 */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-green-900">
                  자동 조건검색 결과
                </h3>
                <p className="text-sm text-green-700">
                  조건식: {autoResult.condition_name}
                </p>
                <p className="text-sm text-green-700">
                  검색된 종목 수: {autoResult.count}개
                </p>
                <p className="text-xs text-green-600 mt-1">
                  💡 5분마다 자동으로 업데이트됩니다
                </p>
              </div>
              {lastUpdate && (
                <div className="text-right">
                  <p className="text-xs text-green-600">
                    마지막 업데이트
                  </p>
                  <p className="text-xs text-green-600">
                    {lastUpdate.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 종목 목록 */}
          {autoResult.result && autoResult.result.length > 0 ? (
            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">추천 종목 목록</h4>
              <div className="grid gap-3">
                {autoResult.result.map((stock, index) => (
                  <div
                    key={stock.code}
                    className="bg-white rounded-md p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">
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
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          추천
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">검색된 종목이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && !autoResult && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">자동 조건검색 결과를 불러오는 중...</p>
        </div>
      )}
    </div>
  );
};

export default AutoConditionView; 