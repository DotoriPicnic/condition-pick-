import sys
import json
import time
import locale
from datetime import datetime, timedelta
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QEventLoop, QTimer
from pykiwoom.kiwoom import *

# 한글 인코딩 설정
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    locale.setlocale(locale.LC_ALL, 'Korean_Korea.UTF-8')

class KiwoomAdvancedFilter:
    def __init__(self):
        self.app = QApplication(sys.argv)
        self.kiwoom = Kiwoom()
        self.event_loop = QEventLoop()
        
        # 이벤트 핸들러 연결
        self.kiwoom.OnEventConnect = self.on_event_connect
        self.kiwoom.OnReceiveTrData = self.on_receive_tr_data
        self.kiwoom.OnReceiveRealCondition = self.on_receive_real_condition
        
        # 데이터 저장용 변수
        self.daily_data = {}
        self.monthly_data = {}
        self.login_completed = False
        self.current_stock = None
        self.condition_result = []
        self.filtered_stocks = []
        
    def on_event_connect(self, err_code):
        """로그인 이벤트 처리"""
        if err_code == 0:
            print("✅ 키움증권 로그인 성공!")
            self.login_completed = True
        else:
            print(f"❌ 키움증권 로그인 실패: {err_code}")
            
        self.event_loop.quit()
        
    def on_receive_tr_data(self, screen_no, rqname, trcode, record_name, prev_next, 
                          data_len, error_code, message, splm_msg):
        """TR 데이터 수신 처리"""
        if trcode == "opt10081":  # 일봉 데이터
            self.process_daily_data(trcode, record_name)
        elif trcode == "opt10082":  # 월봉 데이터
            self.process_monthly_data(trcode, record_name)
            
        self.event_loop.quit()
        
    def on_receive_real_condition(self, code, type, condition_name, condition_index):
        """실시간 조건검색 결과 수신"""
        print(f"실시간 조건검색: {code}, {condition_name}")
        
    def connect(self):
        """키움증권 API 연결"""
        print("🔐 키움증권 연결 시도 중...")
        
        current_state = self.kiwoom.GetConnectState()
        
        if current_state == 1:
            print("✅ 이미 연결된 상태")
            self.login_completed = True
            return True
        
        try:
            self.kiwoom.CommConnect(block=True)
            
            for i in range(10):
                time.sleep(1)
                current_state = self.kiwoom.GetConnectState()
                
                if current_state == 1:
                    print("✅ 키움증권 연결 성공")
                    self.login_completed = True
                    return True
            
            print("❌ 키움증권 연결 실패")
            return False
            
        except Exception as e:
            print(f"❌ 연결 중 오류: {e}")
            return False
    
    def login(self):
        """키움증권 로그인"""
        if not self.login_completed:
            return False
        
        try:
            for i in range(15):
                time.sleep(1)
                login_state = self.kiwoom.GetConnectState()
                
                if login_state == 1:
                    print("✅ 키움증권 로그인 완료")
                    return True
            
            print("❌ 키움증권 로그인 실패")
            return False
            
        except Exception as e:
            print(f"❌ 로그인 중 오류: {e}")
            return False
            
    def get_condition_result(self):
        """기존 조건검색 결과 가져오기"""
        print("📊 기존 조건검색 결과 가져오기...")
        
        # 기존 조건검색 실행
        try:
            # 조건식 목록 가져오기
            self.kiwoom.GetConditionLoad()
            time.sleep(1)
            
            # 조건식 목록 확인
            condition_list = self.kiwoom.GetConditionNameList()
            print(f"조건식 목록: {condition_list}")
            
            if condition_list:
                # 첫 번째 조건식 사용 (인덱스 0)
                condition_name = "새조건명"  # 기본 조건식명
                
                # 조건검색 실행
                result = self.kiwoom.SendCondition("0101", condition_name, 0, 1)
                print(f"조건검색 결과: {result}")
                
                # 결과 처리
                if isinstance(result, list) and result:
                    for code in result:
                        if code.strip():
                            stock_name = self.kiwoom.GetMasterCodeName(code)
                            self.condition_result.append({
                                'code': code,
                                'name': stock_name
                            })
                    print(f"✅ 조건검색 완료: {len(self.condition_result)}개 종목")
                    return True
                else:
                    print("❌ 조건검색 결과 없음")
                    return False
            else:
                print("❌ 조건식 목록 없음")
                return False
                
        except Exception as e:
            print(f"❌ 조건검색 오류: {e}")
            return False
            
    def get_daily_data(self, stock_code):
        """일봉 데이터 요청"""
        print(f"📊 {stock_code} 일봉 데이터 요청 중...")
        
        try:
            # TR 요청 파라미터 설정
            self.kiwoom.SetInputValue("종목코드", stock_code)
            self.kiwoom.SetInputValue("기준일자", "")
            self.kiwoom.SetInputValue("수정주가구분", "1")
            
            # TR 요청
            result = self.kiwoom.CommRqData("일봉데이터", "opt10081", 0, "0101")
            
            if result == 0:
                print(f"✅ {stock_code} 일봉 데이터 요청 성공")
                self.event_loop.exec_()
                return True
            else:
                print(f"❌ {stock_code} 일봉 데이터 요청 실패: {result}")
                return False
                
        except Exception as e:
            print(f"❌ 일봉 데이터 요청 오류: {e}")
            return False
            
    def get_monthly_data(self, stock_code):
        """월봉 데이터 요청"""
        print(f"📈 {stock_code} 월봉 데이터 요청 중...")
        
        try:
            # TR 요청 파라미터 설정
            self.kiwoom.SetInputValue("종목코드", stock_code)
            self.kiwoom.SetInputValue("기준일자", "")
            self.kiwoom.SetInputValue("수정주가구분", "1")
            
            # TR 요청
            result = self.kiwoom.CommRqData("월봉데이터", "opt10082", 0, "0102")
            
            if result == 0:
                print(f"✅ {stock_code} 월봉 데이터 요청 성공")
                self.event_loop.exec_()
                return True
            else:
                print(f"❌ {stock_code} 월봉 데이터 요청 실패: {result}")
                return False
                
        except Exception as e:
            print(f"❌ 월봉 데이터 요청 오류: {e}")
            return False
            
    def process_daily_data(self, trcode, record_name):
        """일봉 데이터 처리"""
        try:
            data_count = self.kiwoom.GetRepeatCnt(trcode, record_name)
            print(f"📊 수신된 일봉 데이터: {data_count}개")
            
            daily_data = []
            
            for i in range(min(data_count, 20)):  # 최근 20일만
                # 각 필드 데이터 추출
                date = self.kiwoom.GetCommData(trcode, record_name, i, "일자").strip()
                open_price = int(self.kiwoom.GetCommData(trcode, record_name, i, "시가").strip())
                high_price = int(self.kiwoom.GetCommData(trcode, record_name, i, "고가").strip())
                low_price = int(self.kiwoom.GetCommData(trcode, record_name, i, "저가").strip())
                close_price = int(self.kiwoom.GetCommData(trcode, record_name, i, "현재가").strip())
                volume = int(self.kiwoom.GetCommData(trcode, record_name, i, "거래량").strip())
                
                daily_item = {
                    "date": date,
                    "open": open_price,
                    "high": high_price,
                    "low": low_price,
                    "close": close_price,
                    "volume": volume
                }
                
                daily_data.append(daily_item)
                
            # 최근 데이터부터 정렬
            daily_data.reverse()
            self.daily_data[self.current_stock] = daily_data
            
        except Exception as e:
            print(f"❌ 일봉 데이터 처리 오류: {e}")
            
    def process_monthly_data(self, trcode, record_name):
        """월봉 데이터 처리"""
        try:
            data_count = self.kiwoom.GetRepeatCnt(trcode, record_name)
            print(f"📈 수신된 월봉 데이터: {data_count}개")
            
            monthly_data = []
            
            for i in range(min(data_count, 6)):  # 최근 6개월만
                # 각 필드 데이터 추출
                date = self.kiwoom.GetCommData(trcode, record_name, i, "일자").strip()
                close_price = int(self.kiwoom.GetCommData(trcode, record_name, i, "현재가").strip())
                
                monthly_item = {
                    "date": date,
                    "close": close_price
                }
                
                monthly_data.append(monthly_item)
                
            # 최근 데이터부터 정렬
            monthly_data.reverse()
            self.monthly_data[self.current_stock] = monthly_data
            
        except Exception as e:
            print(f"❌ 월봉 데이터 처리 오류: {e}")
            
    def check_tail_upward(self, daily_data):
        """조건 1: 꼬리 우상향 확인"""
        if len(daily_data) < 20:
            return False
            
        tail_upward_count = 0
        
        for day in daily_data[:20]:  # 최근 20일
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
        
    def check_bottom_twice(self, daily_data):
        """조건 2: 바닥 2회 확인"""
        if len(daily_data) < 20:
            return False
            
        # 최근 20일 데이터에서 저점 찾기
        lows = [day['low'] for day in daily_data[:20]]
        min_low = min(lows)
        
        # 저점 근처(±2%)로 2번 이상 출현하는지 확인
        bottom_threshold = min_low * 1.02  # 저점 + 2%
        bottom_count = 0
        
        for low in lows:
            if low <= bottom_threshold:
                bottom_count += 1
                
        return bottom_count >= 2
        
    def is_downtrend(self, monthly_data):
        """조건 3: 하락장 확인 (월봉 분석)"""
        if len(monthly_data) < 6:
            return False
            
        # 최근 3개월 평균 종가
        recent_3m_avg = sum([month['close'] for month in monthly_data[:3]]) / 3
        
        # 최근 6개월 평균 종가
        recent_6m_avg = sum([month['close'] for month in monthly_data[:6]]) / 6
        
        # 3개월 평균이 6개월 평균보다 낮으면 하락장
        return recent_3m_avg < recent_6m_avg
        
    def run_advanced_filter(self):
        """고급 필터링 실행"""
        if not self.login_completed:
            print("❌ 로그인이 필요합니다.")
            return None
            
        print("🔍 고급 필터링 시작...")
        
        # 1단계: 기존 조건검색 결과 가져오기
        if not self.get_condition_result():
            print("❌ 기존 조건검색 결과를 가져올 수 없습니다.")
            return None
            
        print(f"📊 기존 조건검색 결과: {len(self.condition_result)}개 종목")
        
        # 2단계: 각 종목에 대해 고급 필터링 적용
        filtered_stocks = []
        
        for i, stock in enumerate(self.condition_result):
            print(f"🔍 {i+1}/{len(self.condition_result)}: {stock['name']}({stock['code']}) 분석 중...")
            
            self.current_stock = stock['code']
            
            # 일봉 데이터 요청 (실패하면 건너뛰기)
            if not self.get_daily_data(stock['code']):
                print(f"  ❌ 일봉 데이터 수신 실패")
                continue
                
            time.sleep(0.5)  # API 호출 제한 방지
            
            # 데이터 확인
            if stock['code'] not in self.daily_data:
                print(f"  ❌ 데이터 수신 실패")
                continue
                
            daily_data = self.daily_data[stock['code']]
            
            # 조건 1: 꼬리 우상향 확인
            if not self.check_tail_upward(daily_data):
                print(f"  ❌ 꼬리 우상향 조건 불만족")
                continue
                
            # 조건 2: 바닥 2회 확인
            if not self.check_bottom_twice(daily_data):
                print(f"  ❌ 바닥 2회 조건 불만족")
                continue
                
            # 조건 1, 2 모두 만족
            print(f"  ✅ 꼬리우상향 + 바닥2회 조건 만족!")
            filtered_stocks.append({
                "name": stock['name'],
                "code": stock['code'],
                "price": daily_data[-1]['close']  # 최신 종가
            })
            
        return filtered_stocks
        
    def save_filtered_stocks(self, filtered_stocks):
        """필터링된 종목들을 data.json으로 저장"""
        try:
            # 결과가 없으면 빈 배열로 저장
            if not filtered_stocks:
                filtered_stocks = []
                
            with open('data.json', 'w', encoding='utf-8') as f:
                json.dump(filtered_stocks, f, ensure_ascii=False, indent=2)
                
            print(f"✅ 고급 필터링 완료!")
            print(f"📊 총 {len(filtered_stocks)}개 종목이 조건을 만족했습니다.")
            print(f"💾 결과가 data.json 파일로 저장되었습니다.")
            
            # 결과 출력
            if filtered_stocks:
                for stock in filtered_stocks:
                    print(f"  📈 {stock['name']}({stock['code']}) - {stock['price']:,}원")
            else:
                print("  📊 조건을 만족하는 종목이 없습니다.")
                
        except Exception as e:
            print(f"❌ 파일 저장 실패: {e}")

def run_advanced_filter_api():
    """고급 필터링 API 실행 함수"""
    try:
        # 키움 API 인스턴스 생성
        kiwoom_filter = KiwoomAdvancedFilter()
        
        # 연결
        if not kiwoom_filter.connect():
            return {
                "success": False,
                "error": "키움증권 연결 실패"
            }
            
        # 로그인
        if not kiwoom_filter.login():
            return {
                "success": False,
                "error": "키움증권 로그인 실패"
            }
            
        # 고급 필터링 실행
        filtered_stocks = kiwoom_filter.run_advanced_filter()
        
        if filtered_stocks is None:
            return {
                "success": False,
                "error": "고급 필터링 실행 실패"
            }
            
        # 결과 저장
        kiwoom_filter.save_filtered_stocks(filtered_stocks)
        
        # JSON 결과 반환
        return {
            "success": True,
            "condition_name": "꼬리우상향_바닥2회",
            "count": len(filtered_stocks),
            "result": filtered_stocks
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"고급 필터링 오류: {str(e)}"
        }

if __name__ == "__main__":
    # API 실행
    result = run_advanced_filter_api()
    
    # JSON 결과만 출력 (로그 메시지와 분리)
    print("JSON_RESULT_START")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print("JSON_RESULT_END")
    sys.exit(0) 