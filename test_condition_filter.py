import json
import random
from datetime import datetime

def generate_test_data():
    """테스트용 일봉 및 월봉 데이터 생성"""
    # KOSPI 상위 종목들
    stock_list = [
        {"name": "삼성전자", "code": "005930"},
        {"name": "SK하이닉스", "code": "000660"},
        {"name": "NAVER", "code": "035420"},
        {"name": "카카오", "code": "035720"},
        {"name": "LG에너지솔루션", "code": "373220"},
        {"name": "현대차", "code": "005380"},
        {"name": "기아", "code": "000270"},
        {"name": "POSCO홀딩스", "code": "005490"},
        {"name": "LG화학", "code": "051910"},
        {"name": "삼성바이오로직스", "code": "207940"}
    ]
    
    filtered_stocks = []
    
    for stock in stock_list:
        print(f"🔍 {stock['name']}({stock['code']}) 분석 중...")
        
        # 일봉 데이터 생성 (조건에 맞는 패턴 생성)
        daily_data = generate_daily_data_with_conditions(stock['code'])
        
        # 월봉 데이터 생성
        monthly_data = generate_monthly_data(stock['code'])
        
        # 조건 1: 꼬리 우상향 확인
        if not check_tail_upward(daily_data):
            print(f"  ❌ 꼬리 우상향 조건 불만족")
            continue
            
        # 조건 2: 바닥 2회 확인
        if not check_bottom_twice(daily_data):
            print(f"  ❌ 바닥 2회 조건 불만족")
            continue
            
        # 조건 3: 하락장 제외 (월봉 분석)
        if is_downtrend(monthly_data):
            print(f"  ❌ 하락장 제외")
            continue
            
        # 모든 조건 만족
        print(f"  ✅ 모든 조건 만족!")
        filtered_stocks.append({
            "name": stock['name'],
            "code": stock['code'],
            "price": daily_data[-1]['close']  # 최신 종가
        })
    
    return filtered_stocks

def generate_daily_data_with_conditions(stock_code):
    """조건에 맞는 일봉 데이터 생성"""
    daily_data = []
    base_price = 50000 + hash(stock_code) % 50000
    
    # 조건에 맞는 패턴 생성
    for i in range(20):  # 최근 20일
        # 꼬리 우상향 패턴을 위한 설정
        if i % 5 == 0:  # 5일마다 꼬리 우상향 패턴
            open_price = base_price + 1000
            high_price = open_price + 800
            low_price = open_price - 1200  # 긴 꼬리
            close_price = open_price + 500  # 상승
        else:
            # 일반적인 패턴
            price_change = random.randint(-500, 500)
            open_price = base_price + price_change
            high_price = open_price + random.randint(200, 800)
            low_price = open_price - random.randint(200, 600)
            close_price = open_price + random.randint(-300, 300)
        
        daily_item = {
            "date": f"202412{20-i:02d}",
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "close": close_price,
            "volume": random.randint(1000000, 5000000)
        }
        daily_data.append(daily_item)
        
        # 다음 날을 위한 기준가 업데이트
        base_price = close_price
    
    return daily_data

def generate_monthly_data(stock_code):
    """월봉 데이터 생성"""
    monthly_data = []
    base_price = 50000 + hash(stock_code) % 50000
    
    # 상승장 패턴 생성 (3개월 평균 > 6개월 평균)
    for i in range(6):  # 최근 6개월
        if i < 3:  # 최근 3개월은 높은 가격
            close_price = base_price + random.randint(2000, 5000)
        else:  # 이전 3개월은 낮은 가격
            close_price = base_price + random.randint(-3000, 1000)
        
        monthly_item = {
            "date": f"2024{12-i:02d}",
            "close": close_price
        }
        monthly_data.append(monthly_item)
        
        base_price = close_price
    
    return monthly_data

def check_tail_upward(daily_data):
    """조건 1: 꼬리 우상향 확인"""
    tail_upward_count = 0
    
    for day in daily_data:
        # 시가 < 종가 조건
        if day['open'] >= day['close']:
            continue
            
        # 전체 봉 길이 계산
        total_length = day['high'] - day['low']
        if total_length == 0:
            continue
            
        # 꼬리 길이 계산 (시가 - 저가)
        tail_length = day['open'] - day['low']
        
        # 꼬리가 전체 봉 길이의 30% 이상인지 확인
        if tail_length >= total_length * 0.3:
            tail_upward_count += 1
            
    # 최소 3일 이상 꼬리 우상향이 있어야 함
    return tail_upward_count >= 3

def check_bottom_twice(daily_data):
    """조건 2: 바닥 2회 확인"""
    # 최근 20일 데이터에서 저점 찾기
    lows = [day['low'] for day in daily_data]
    min_low = min(lows)
    
    # 저점 근처(±2%)로 2번 이상 출현하는지 확인
    bottom_threshold = min_low * 1.02  # 저점 + 2%
    bottom_count = 0
    
    for low in lows:
        if low <= bottom_threshold:
            bottom_count += 1
            
    return bottom_count >= 2

def is_downtrend(monthly_data):
    """조건 3: 하락장 확인 (월봉 분석)"""
    if len(monthly_data) < 6:
        return False
        
    # 최근 3개월 평균 종가
    recent_3m_avg = sum([month['close'] for month in monthly_data[:3]]) / 3
    
    # 최근 6개월 평균 종가
    recent_6m_avg = sum([month['close'] for month in monthly_data[:6]]) / 6
    
    # 3개월 평균이 6개월 평균보다 낮으면 하락장
    return recent_3m_avg < recent_6m_avg

def save_filtered_stocks(filtered_stocks):
    """필터링된 종목들을 data.json으로 저장"""
    try:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(filtered_stocks, f, ensure_ascii=False, indent=2)
            
        print(f"✅ 조건검색 완료!")
        print(f"📊 총 {len(filtered_stocks)}개 종목이 조건을 만족했습니다.")
        print(f"💾 결과가 data.json 파일로 저장되었습니다.")
        
        # 결과 출력
        for stock in filtered_stocks:
            print(f"  📈 {stock['name']}({stock['code']}) - {stock['price']:,}원")
            
    except Exception as e:
        print(f"❌ 파일 저장 실패: {e}")

def main():
    """메인 함수"""
    print("🔍 조건검색 필터 테스트 시작...")
    print("=" * 50)
    
    # 조건검색 실행
    filtered_stocks = generate_test_data()
    
    print("=" * 50)
    # 결과 저장
    save_filtered_stocks(filtered_stocks)

if __name__ == "__main__":
    main() 