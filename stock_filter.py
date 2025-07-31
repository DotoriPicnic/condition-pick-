import json
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any
import subprocess
import os

# 샘플 주식 데이터 생성 함수
def create_sample_data() -> List[Dict[str, Any]]:
    """샘플 주식 데이터를 생성합니다."""
    stocks = [
        {
            "name": "삼성전자",
            "code": "005930",
            "daily_data": [
                {"date": "2024-01-15", "open": 75000, "high": 78000, "low": 74500, "close": 77800},
                {"date": "2024-01-16", "open": 77500, "high": 78500, "low": 77000, "close": 78200},
                {"date": "2024-01-17", "open": 78000, "high": 79000, "low": 77500, "close": 78800},
                {"date": "2024-01-18", "open": 78500, "high": 79500, "low": 78000, "close": 79200},
                {"date": "2024-01-19", "open": 79000, "high": 80000, "low": 78500, "close": 79800},
                {"date": "2024-01-22", "open": 79500, "high": 80500, "low": 79000, "close": 80200},
                {"date": "2024-01-23", "open": 80000, "high": 81000, "low": 79500, "close": 80800},
                {"date": "2024-01-24", "open": 80500, "high": 81500, "low": 80000, "close": 81200},
                {"date": "2024-01-25", "open": 81000, "high": 82000, "low": 80500, "close": 81800},
                {"date": "2024-01-26", "open": 81500, "high": 82500, "low": 81000, "close": 82200},
                {"date": "2024-01-29", "open": 82000, "high": 83000, "low": 81500, "close": 82800},
                {"date": "2024-01-30", "open": 82500, "high": 83500, "low": 82000, "close": 83200},
                {"date": "2024-01-31", "open": 83000, "high": 84000, "low": 82500, "close": 83800},
                {"date": "2024-02-01", "open": 83500, "high": 84500, "low": 83000, "close": 84200},
                {"date": "2024-02-02", "open": 84000, "high": 85000, "low": 83500, "close": 84800},
                {"date": "2024-02-05", "open": 84500, "high": 85500, "low": 84000, "close": 85200},
                {"date": "2024-02-06", "open": 85000, "high": 86000, "low": 84500, "close": 85800},
                {"date": "2024-02-07", "open": 85500, "high": 86500, "low": 85000, "close": 86200},
                {"date": "2024-02-08", "open": 86000, "high": 87000, "low": 85500, "close": 86800},
                {"date": "2024-02-09", "open": 86500, "high": 87500, "low": 86000, "close": 87200},
            ],
            "monthly_data": [
                {"date": "2023-08", "close": 72000},
                {"date": "2023-09", "close": 73000},
                {"date": "2023-10", "close": 74000},
                {"date": "2023-11", "close": 75000},
                {"date": "2023-12", "close": 76000},
                {"date": "2024-01", "close": 77000},
            ]
        },
        {
            "name": "카카오",
            "code": "035720",
            "daily_data": [
                {"date": "2024-01-15", "open": 54000, "high": 57000, "low": 53500, "close": 56100},
                {"date": "2024-01-16", "open": 56000, "high": 58000, "low": 55500, "close": 57500},
                {"date": "2024-01-17", "open": 57000, "high": 59000, "low": 56500, "close": 58500},
                {"date": "2024-01-18", "open": 58000, "high": 60000, "low": 57500, "close": 59500},
                {"date": "2024-01-19", "open": 59000, "high": 61000, "low": 58500, "close": 60500},
                {"date": "2024-01-22", "open": 60000, "high": 62000, "low": 59500, "close": 61500},
                {"date": "2024-01-23", "open": 61000, "high": 63000, "low": 60500, "close": 62500},
                {"date": "2024-01-24", "open": 62000, "high": 64000, "low": 61500, "close": 63500},
                {"date": "2024-01-25", "open": 63000, "high": 65000, "low": 62500, "close": 64500},
                {"date": "2024-01-26", "open": 64000, "high": 66000, "low": 63500, "close": 65500},
                {"date": "2024-01-29", "open": 65000, "high": 67000, "low": 64500, "close": 66500},
                {"date": "2024-01-30", "open": 66000, "high": 68000, "low": 65500, "close": 67500},
                {"date": "2024-01-31", "open": 67000, "high": 69000, "low": 66500, "close": 68500},
                {"date": "2024-02-01", "open": 68000, "high": 70000, "low": 67500, "close": 69500},
                {"date": "2024-02-02", "open": 69000, "high": 71000, "low": 68500, "close": 70500},
                {"date": "2024-02-05", "open": 70000, "high": 72000, "low": 69500, "close": 71500},
                {"date": "2024-02-06", "open": 71000, "high": 73000, "low": 70500, "close": 72500},
                {"date": "2024-02-07", "open": 72000, "high": 74000, "low": 71500, "close": 73500},
                {"date": "2024-02-08", "open": 73000, "high": 75000, "low": 72500, "close": 74500},
                {"date": "2024-02-09", "open": 74000, "high": 76000, "low": 73500, "close": 75500},
            ],
            "monthly_data": [
                {"date": "2023-08", "close": 52000},
                {"date": "2023-09", "close": 53000},
                {"date": "2023-10", "close": 54000},
                {"date": "2023-11", "close": 55000},
                {"date": "2023-12", "close": 56000},
                {"date": "2024-01", "close": 57000},
            ]
        },
        {
            "name": "네이버",
            "code": "035420",
            "daily_data": [
                {"date": "2024-01-15", "open": 220000, "high": 225000, "low": 218000, "close": 223000},
                {"date": "2024-01-16", "open": 222000, "high": 227000, "low": 220000, "close": 225000},
                {"date": "2024-01-17", "open": 224000, "high": 229000, "low": 222000, "close": 227000},
                {"date": "2024-01-18", "open": 226000, "high": 231000, "low": 224000, "close": 229000},
                {"date": "2024-01-19", "open": 228000, "high": 233000, "low": 226000, "close": 231000},
                {"date": "2024-01-22", "open": 230000, "high": 235000, "low": 228000, "close": 233000},
                {"date": "2024-01-23", "open": 232000, "high": 237000, "low": 230000, "close": 235000},
                {"date": "2024-01-24", "open": 234000, "high": 239000, "low": 232000, "close": 237000},
                {"date": "2024-01-25", "open": 236000, "high": 241000, "low": 234000, "close": 239000},
                {"date": "2024-01-26", "open": 238000, "high": 243000, "low": 236000, "close": 241000},
                {"date": "2024-01-29", "open": 240000, "high": 245000, "low": 238000, "close": 243000},
                {"date": "2024-01-30", "open": 242000, "high": 247000, "low": 240000, "close": 245000},
                {"date": "2024-01-31", "open": 244000, "high": 249000, "low": 242000, "close": 247000},
                {"date": "2024-02-01", "open": 246000, "high": 251000, "low": 244000, "close": 249000},
                {"date": "2024-02-02", "open": 248000, "high": 253000, "low": 246000, "close": 251000},
                {"date": "2024-02-05", "open": 250000, "high": 255000, "low": 248000, "close": 253000},
                {"date": "2024-02-06", "open": 252000, "high": 257000, "low": 250000, "close": 255000},
                {"date": "2024-02-07", "open": 254000, "high": 259000, "low": 252000, "close": 257000},
                {"date": "2024-02-08", "open": 256000, "high": 261000, "low": 254000, "close": 259000},
                {"date": "2024-02-09", "open": 258000, "high": 263000, "low": 256000, "close": 261000},
            ],
            "monthly_data": [
                {"date": "2023-08", "close": 210000},
                {"date": "2023-09", "close": 215000},
                {"date": "2023-10", "close": 220000},
                {"date": "2023-11", "close": 225000},
                {"date": "2023-12", "close": 230000},
                {"date": "2024-01", "close": 235000},
            ]
        }
    ]
    return stocks

def check_condition_1(daily_data: List[Dict]) -> bool:
    """
    조건 1: 꼬리 우상향
    - 시가(open) < 종가(close)이고
    - (시가 - 저가)/(고가 - 저가) >= 0.3
    """
    if not daily_data:
        return False
    
    latest = daily_data[-1]  # 최신 일봉 데이터
    open_price = latest["open"]
    close_price = latest["close"]
    high_price = latest["high"]
    low_price = latest["low"]
    
    # 시가 < 종가 확인
    if open_price >= close_price:
        return False
    
    # (시가 - 저가)/(고가 - 저가) >= 0.3 확인
    if high_price == low_price:  # 고가와 저가가 같은 경우 (극히 드문 경우)
        return False
    
    ratio = (open_price - low_price) / (high_price - low_price)
    return ratio >= 0.3

def check_condition_2(daily_data: List[Dict]) -> bool:
    """
    조건 2: 최근 20일 종가 중 저점 ±2% 내 가격이 2회 이상 등장한 종목은 바닥 2회로 간주
    """
    if len(daily_data) < 20:
        return False
    
    # 최근 20일 종가 추출
    recent_20_days = daily_data[-20:]
    close_prices = [day["close"] for day in recent_20_days]
    
    # 최저가 찾기
    min_price = min(close_prices)
    
    # ±2% 범위 계산
    lower_bound = min_price * 0.98
    upper_bound = min_price * 1.02
    
    # ±2% 범위 내에 있는 가격 개수 세기
    count = sum(1 for price in close_prices if lower_bound <= price <= upper_bound)
    
    return count >= 2

def check_condition_3(monthly_data: List[Dict]) -> bool:
    """
    조건 3: 월봉 데이터 기준 최근 3개월 평균 종가가 6개월 평균보다 높을 것
    """
    if len(monthly_data) < 6:
        return False
    
    # 최근 6개월 종가 추출
    recent_6_months = monthly_data[-6:]
    close_prices = [month["close"] for month in recent_6_months]
    
    # 최근 3개월 평균
    recent_3_months_avg = np.mean(close_prices[-3:])
    
    # 최근 6개월 평균
    recent_6_months_avg = np.mean(close_prices)
    
    return recent_3_months_avg > recent_6_months_avg

def auto_git_commit_push(commit_message: str = None) -> bool:
    """
    자동으로 Git add, commit, push를 수행합니다.
    
    Args:
        commit_message: 커밋 메시지 (None이면 자동 생성)
    
    Returns:
        bool: 성공 여부
    """
    try:
        # 커밋 메시지가 없으면 자동 생성
        if not commit_message:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            commit_message = f"Auto update: {current_time}"
        
        print("🔄 Git 자동화 시작...")
        
        # 1. git add .
        print("  📁 git add . 실행 중...")
        result = subprocess.run(['git', 'add', '.'], capture_output=True, text=True, check=True)
        print("  ✅ git add 완료")
        
        # 2. git commit
        print(f"  💾 git commit 실행 중... (메시지: {commit_message})")
        result = subprocess.run(['git', 'commit', '-m', commit_message], capture_output=True, text=True, check=True)
        print("  ✅ git commit 완료")
        
        # 3. git push
        print("  🚀 git push 실행 중...")
        result = subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True, text=True, check=True)
        print("  ✅ git push 완료")
        
        print("🎉 Git 자동화 완료!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Git 자동화 실패: {e}")
        print(f"   stdout: {e.stdout}")
        print(f"   stderr: {e.stderr}")
        return False
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        return False

def filter_stocks(stocks_data: List[Dict]) -> List[Dict]:
    """모든 조건을 만족하는 종목을 필터링합니다."""
    filtered_stocks = []
    
    for stock in stocks_data:
        print(f"분석 중: {stock['name']} ({stock['code']})")
        
        # 조건 1: 꼬리 우상향
        condition1 = check_condition_1(stock['daily_data'])
        print(f"  조건 1 (꼬리 우상향): {'통과' if condition1 else '실패'}")
        
        # 조건 2: 바닥 2회
        condition2 = check_condition_2(stock['daily_data'])
        print(f"  조건 2 (바닥 2회): {'통과' if condition2 else '실패'}")
        
        # 조건 3: 3개월 평균 > 6개월 평균
        condition3 = check_condition_3(stock['monthly_data'])
        print(f"  조건 3 (평균 비교): {'통과' if condition3 else '실패'}")
        
        # 모든 조건을 만족하는 경우
        if condition1 and condition2 and condition3:
            filtered_stocks.append({
                "name": stock["name"],
                "code": stock["code"],
                "price": stock["daily_data"][-1]["close"]  # 최신 종가
            })
            print(f"  결과: 모든 조건 통과!")
        else:
            print(f"  결과: 조건 미충족")
        
        print()
    
    return filtered_stocks

def save_to_json(filtered_stocks: List[Dict], filename: str = "data.json"):
    """필터링된 종목을 JSON 파일로 저장합니다."""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(filtered_stocks, f, ensure_ascii=False, indent=2)
    print(f"결과가 {filename} 파일로 저장되었습니다.")

def main():
    """메인 함수"""
    print("주식 필터링 시작...")
    print("=" * 50)
    
    # 샘플 데이터 생성
    stocks_data = create_sample_data()
    
    # 조건에 맞는 종목 필터링
    filtered_stocks = filter_stocks(stocks_data)
    
    # 결과 출력
    print("=" * 50)
    print(f"필터링 결과: {len(filtered_stocks)}개 종목이 조건을 만족합니다.")
    
    if filtered_stocks:
        print("\n조건을 만족한 종목:")
        for stock in filtered_stocks:
            print(f"  - {stock['name']} ({stock['code']}): {stock['price']:,}원")
    
    # JSON 파일로 저장
    save_to_json(filtered_stocks)
    
    # Git 자동화 실행
    print("\n" + "=" * 50)
    print("Git 자동화 시작...")
    
    # 커밋 메시지 생성
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_message = f"Auto update stock data: {len(filtered_stocks)} stocks filtered at {current_time}"
    
    # Git 자동화 실행
    success = auto_git_commit_push(commit_message)
    
    if success:
        print("✅ 모든 작업이 완료되었습니다!")
    else:
        print("⚠️  필터링은 완료되었지만 Git 자동화에 실패했습니다.")

if __name__ == "__main__":
    main() 