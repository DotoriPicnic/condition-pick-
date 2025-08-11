import React, { useState } from 'react';
import ConditionSearchView from './ConditionSearchView';
import AutoConditionView from './AutoConditionView';
import AdvancedConditionView from './AdvancedConditionView';

function App() {
  const [activeTab, setActiveTab] = useState('auto');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            키움증권 조건검색 대시보드
          </h1>
          <p className="text-gray-600">
            실시간 주식 데이터와 조건검색 결과를 확인하세요
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setActiveTab('auto')}
              className={`px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'auto'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              추천 종목
            </button>
            <button
              onClick={() => setActiveTab('condition')}
              className={`px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'condition'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              조건검색 결과
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'advanced'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              고급 조건검색
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="mb-8">
          {activeTab === 'auto' && <AutoConditionView />}
          {activeTab === 'condition' && <ConditionSearchView />}
          {activeTab === 'advanced' && <AdvancedConditionView />}
        </div>

        {/* 푸터 */}
        <div className="text-center text-gray-500 text-sm">
          <p>실시간 데이터는 30초마다 자동으로 업데이트됩니다.</p>
        </div>
      </div>
    </div>
  );
}

export default App; 