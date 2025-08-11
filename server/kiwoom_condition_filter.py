import sys
import json
import time
import locale
import logging
import os
import statistics
from datetime import datetime, timedelta
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QEventLoop, QTimer
from pykiwoom.kiwoom import *

# 로깅 설정 (변경사항 8)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('kiwoom_condition_filter.log', encoding='utf-8')
    ]
)

# 한글 인코딩 설정
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    locale.setlocale(locale.LC_ALL, 'Korean_Korea.UTF-8')

class KiwoomConditionFilter:
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
        self.stock_list = []
        self.filtered_stocks = []
        
        # KOSPI 상위 종목 목록
        self.stock_list = [
            {"name": "삼성전자", "code": "005930"},
            {"name": "SK하이닉스", "code": "000660"},
            {"name": "NAVER", "code": "035420"},
            {"name": "카카오", "code": "035720"},
            {"name": "LG에너지솔루션", "code": "373220"},
            {"name": "현대차", "code": "005380"},
            {"name": "기아", "code": "000270"},
            {"name": "POSCO홀딩스", "code": "005490"},
            {"name": "LG화학", "code": "051910"},
            {"name": "삼성바이오로직스", "code": "207940"},
            {"name": "현대모비스", "code": "012330"},
            {"name": "KB금융", "code": "105560"},
            {"name": "신한지주", "code": "055550"},
            {"name": "하나금융지주", "code": "086790"},
            {"name": "LG전자", "code": "066570"},
            {"name": "삼성SDI", "code": "006400"},
            {"name": "포스코퓨처엠", "code": "003670"},
            {"name": "아모레퍼시픽", "code": "090430"},
            {"name": "LG생활건강", "code": "051900"},
            {"name": "셀트리온", "code": "068270"}
        ]
        
    def on_event_connect(self, err_code):
        """로그인 이벤트 처리"""
        if err_code == 0:
            logging.info("키움증권 로그인 성공!")
            self.login_completed = True
        else:
            logging.error(f"키움증권 로그인 실패: {err_code}")
            
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
        logging.info(f"실시간 조건검색: {code}, {condition_name}")
        
    def login(self):
        """키움증권 로그인"""
        logging.info("키움증권 로그인 시도 중...")
        
        # 기존 방식과 동일한 로그인 처리
        current_state = self.kiwoom.GetConnectState()
        
        if current_state == 1:
            logging.info("이미 연결된 상태")
            self.login_completed = True
            return True
        
        try:
            self.kiwoom.CommConnect(block=True)
            
            for i in range(10):
                time.sleep(1)
                current_state = self.kiwoom.GetConnectState()
                
                if current_state == 1:
                    logging.info("키움증권 연결 성공")
                    self.login_completed = True
                    return True
            
            logging.error("키움증권 연결 실패")
            return False
            
        except Exception as e:
            logging.error(f"로그인 중 오류: {e}")
            return False
            
    def get_daily_data(self, stock_code):
        """일봉 데이터 요청"""
        logging.info(f"{stock_code} 일봉 데이터 요청 중...")
        
        # TR 요청 파라미터 설정
        self.kiwoom.SetInputValue("종목코드", stock_code)
        self.kiwoom.SetInputValue("기준일자", "")
        self.kiwoom.SetInputValue("수정주가구분", "1")
        
        # TR 요청
        result = self.kiwoom.CommRqData("일봉데이터", "opt10081", 0, "0101")
        
        if result == 0:
            logging.info(f"{stock_code} 일봉 데이터 요청 성공")
            self.event_loop.exec_()
        else:
            logging.error(f"{stock_code} 일봉 데이터 요청 실패: {result}")
            
    def get_monthly_data(self, stock_code):
        """월봉 데이터 요청"""
        logging.info(f"{stock_code} 월봉 데이터 요청 중...")
        
        # TR 요청 파라미터 설정
        self.kiwoom.SetInputValue("종목코드", stock_code)
        self.kiwoom.SetInputValue("기준일자", "")
        self.kiwoom.SetInputValue("수정주가구분", "1")
        
        # TR 요청
        result = self.kiwoom.CommRqData("월봉데이터", "opt10082", 0, "0102")
        
        if result == 0:
            logging.info(f"{stock_code} 월봉 데이터 요청 성공")
            self.event_loop.exec_()
        else:
            logging.error(f"{stock_code} 월봉 데이터 요청 실패: {result}")
            
    def process_daily_data(self, trcode, record_name):
        """일봉 데이터 처리 (변경사항 4: 데이터 타입 변환, 3: 날짜 정렬)"""
        data_count = self.kiwoom.GetRepeatCnt(trcode, record_name)
        logging.info(f"수신된 일봉 데이터: {data_count}개")
        
        daily_data = []
        
        for i in range(min(data_count, 20)):  # 최근 20일만
            # 각 필드 데이터 추출 및 타입 변환 (변경사항 4)
            date = self.kiwoom.GetCommData(trcode, record_name, i, "일자").strip()
            open_price = float(self.kiwoom.GetCommData(trcode, record_name, i, "시가").strip())
            high_price = float(self.kiwoom.GetCommData(trcode, record_name, i, "고가").strip())
            low_price = float(self.kiwoom.GetCommData(trcode, record_name, i, "저가").strip())
            close_price = float(self.kiwoom.GetCommData(trcode, record_name, i, "현재가").strip())
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
            
        # 날짜 오름차순 정렬 (변경사항 3)
        daily_data.sort(key=lambda x: datetime.strptime(x['date'], '%Y%m%d'))
        self.daily_data[self.current_stock] = daily_data
        
    def process_monthly_data(self, trcode, record_name):
        """월봉 데이터 처리 (변경사항 4: 데이터 타입 변환, 3: 날짜 정렬)"""
        data_count = self.kiwoom.GetRepeatCnt(trcode, record_name)
        logging.info(f"수신된 월봉 데이터: {data_count}개")
        
        monthly_data = []
        
        for i in range(min(data_count, 6)):  # 최근 6개월만
            # 각 필드 데이터 추출 및 타입 변환 (변경사항 4)
            date = self.kiwoom.GetCommData(trcode, record_name, i, "일자").strip()
            close_price = float(self.kiwoom.GetCommData(trcode, record_name, i, "현재가").strip())
            
            monthly_item = {
                "date": date,
                "close": close_price
            }
            
            monthly_data.append(monthly_item)
            
        # 날짜 오름차순 정렬 (변경사항 3)
        monthly_data.sort(key=lambda x: datetime.strptime(x['date'], '%Y%m'))
        self.monthly_data[self.current_stock] = monthly_data
        
    def check_condition_1(self, daily_data):
        """조건 1: 꼬리 우상향 확인 (변경사항 3: 데이터 정렬 보장)"""
        # 데이터 정렬 보장 (변경사항 3)
        sorted_daily_data = sorted(daily_data, key=lambda x: datetime.strptime(x['date'], '%Y%m%d'))
        
        # 바닥 2회 판정 유연성 (변경사항 5)
        n = min(len(sorted_daily_data), 20)
        if n < 3:
            return False
            
        tail_upward_count = 0
        
        for day in sorted_daily_data[-n:]:  # 최근 n일
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
        
    def check_condition_2(self, daily_data):
        """조건 2: 바닥 2회 확인 (변경사항 3: 데이터 정렬 보장, 5: 판정 유연성)"""
        # 데이터 정렬 보장 (변경사항 3)
        sorted_daily_data = sorted(daily_data, key=lambda x: datetime.strptime(x['date'], '%Y%m%d'))
        
        # 바닥 2회 판정 유연성 (변경사항 5)
        n = min(len(sorted_daily_data), 20)
        if n < 2:
            return False
            
        # 최근 n일 데이터에서 저점 찾기
        lows = [day['low'] for day in sorted_daily_data[-n:]]
        min_low = min(lows)
        
        # 저점 근처(±2%)로 2번 이상 출현하는지 확인
        bottom_threshold = min_low * 1.02  # 저점 + 2%
        bottom_count = 0
        
        for low in lows:
            if low <= bottom_threshold:
                bottom_count += 1
                
        return bottom_count >= 2
        
    def check_condition_3(self, monthly_data):
        """조건 3: 하락장 확인 (월봉 분석) (변경사항 3: 데이터 정렬 보장, 7: statistics.mean 사용, 9: 하락장 필터 강화)"""
        # 데이터 정렬 보장 (변경사항 3)
        sorted_monthly_data = sorted(monthly_data, key=lambda x: datetime.strptime(x['date'], '%Y%m'))
        
        if len(sorted_monthly_data) < 6:
            return False
            
        # 최근 6개월 고점 대비 현재 종가 하락률 계산 (변경사항 9)
        recent_6m_data = sorted_monthly_data[-6:]
        max_price = max([month['close'] for month in recent_6m_data])
        current_price = recent_6m_data[-1]['close']
        decline_rate = (max_price - current_price) / max_price
        
        # 하락률이 50% 이상이면 False 반환 (변경사항 9)
        if decline_rate >= 0.5:
            logging.warning(f"하락률 {decline_rate:.2%} >= 50%로 인한 필터링")
            return False
            
        # 최근 3개월 평균 종가 (변경사항 7: statistics.mean 사용)
        recent_3m_prices = [month['close'] for month in recent_6m_data[-3:]]
        recent_3m_avg = statistics.mean(recent_3m_prices)
        
        # 최근 6개월 평균 종가 (변경사항 7: statistics.mean 사용)
        recent_6m_prices = [month['close'] for month in recent_6m_data]
        recent_6m_avg = statistics.mean(recent_6m_prices)
        
        # 3개월 평균이 6개월 평균보다 낮으면 하락장
        return recent_3m_avg < recent_6m_avg
        
    def auto_git_commit_push(self):
        """Git 자동 커밋 및 푸시 (변경사항 6: AUTO_GIT_PUSH 환경변수 추가)"""
        auto_git_push = os.getenv('AUTO_GIT_PUSH', 'false').lower()
        
        if auto_git_push != 'true':
            logging.info("AUTO_GIT_PUSH=false -> Git 자동화 건너뜀")
            return
            
        try:
            import subprocess
            commit_message = f"자동 조건검색 결과 업데이트 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            subprocess.run(['git', 'add', 'data.json'], check=True)
            subprocess.run(['git', 'commit', '-m', commit_message], check=True)
            subprocess.run(['git', 'push'], check=True)
            
            logging.info("Git 자동 커밋 및 푸시 완료")
        except Exception as e:
            logging.error(f"Git 자동화 실패: {e}")
        
    def run_condition_search(self):
        """조건검색 실행 (변경사항 2: 거래 시간 제한 제거)"""
        if not self.login_completed:
            logging.error("로그인이 필요합니다.")
            return None
            
        logging.info("조건검색 시작...")
        logging.info(f"총 {len(self.stock_list)}개 종목 분석 시작...")
        
        filtered_stocks = []
        
        for i, stock in enumerate(self.stock_list):
            logging.info(f"{i+1}/{len(self.stock_list)}: {stock['name']}({stock['code']}) 분석 중...")
            
            self.current_stock = stock['code']
            
            # 일봉 데이터 요청
            self.get_daily_data(stock['code'])
            time.sleep(0.5)  # API 호출 제한 방지
            
            # 월봉 데이터 요청
            self.get_monthly_data(stock['code'])
            time.sleep(0.5)  # API 호출 제한 방지
            
            # 데이터 확인
            if stock['code'] not in self.daily_data or stock['code'] not in self.monthly_data:
                logging.warning(f"데이터 수신 실패")
                continue
                
            daily_data = self.daily_data[stock['code']]
            monthly_data = self.monthly_data[stock['code']]
            
            # 조건 1: 꼬리 우상향 확인
            if not self.check_condition_1(daily_data):
                logging.debug(f"꼬리 우상향 조건 불만족")
                continue
                
            # 조건 2: 바닥 2회 확인
            if not self.check_condition_2(daily_data):
                logging.debug(f"바닥 2회 조건 불만족")
                continue
                
            # 조건 3: 하락장 제외 (월봉 분석)
            if self.check_condition_3(monthly_data):
                logging.debug(f"하락장 제외")
                continue
                
            # 모든 조건 만족
            logging.info(f"모든 조건 만족!")
            filtered_stocks.append({
                "name": stock['name'],
                "code": stock['code'],
                "price": daily_data[-1]['close']  # 최신 종가
            })
            
        return filtered_stocks
        
    def save_filtered_stocks(self, filtered_stocks):
        """필터링된 종목들을 data.json으로 저장 (변경사항 6: Git 자동화 추가)"""
        try:
            with open('data.json', 'w', encoding='utf-8') as f:
                json.dump(filtered_stocks, f, ensure_ascii=False, indent=2)
                
            logging.info(f"조건검색 완료!")
            logging.info(f"총 {len(filtered_stocks)}개 종목이 조건을 만족했습니다.")
            logging.info(f"결과가 data.json 파일로 저장되었습니다.")
            
            # 결과 출력
            for stock in filtered_stocks:
                logging.info(f"📈 {stock['name']}({stock['code']}) - {stock['price']:,}원")
                
            # Git 자동화 실행 (변경사항 6)
            self.auto_git_commit_push()
                
        except Exception as e:
            logging.error(f"파일 저장 실패: {e}")

def run_condition_search_api():
    """조건검색 API 실행 함수"""
    try:
        # 키움 API 인스턴스 생성
        kiwoom_filter = KiwoomConditionFilter()
        
        # 로그인
        kiwoom_filter.login()
        
        if not kiwoom_filter.login_completed:
            return {
                "success": False,
                "error": "키움증권 로그인 실패"
            }
            
        # 조건검색 실행
        filtered_stocks = kiwoom_filter.run_condition_search()
        
        if filtered_stocks is None:
            return {
                "success": False,
                "error": "조건검색 실행 실패"
            }
            
        # 결과 저장
        kiwoom_filter.save_filtered_stocks(filtered_stocks)
        
        # JSON 결과 반환
        return {
            "success": True,
            "condition_name": "꼬리우상향_바닥2회_상승장",
            "count": len(filtered_stocks),
            "result": filtered_stocks
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"조건검색 오류: {str(e)}"
        }

if __name__ == "__main__":
    # API 실행
    result = run_condition_search_api()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0) 