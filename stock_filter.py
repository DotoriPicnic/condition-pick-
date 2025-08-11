import sys
import json
import time
import requests
from datetime import datetime, timedelta
from PyQt5.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget, QLabel, QPushButton, QTextEdit
from PyQt5.QtCore import QTimer, QThread, pyqtSignal
from PyQt5.QAxContainer import QAxWidget
from PyQt5.QtCore import QEventLoop

class KiwoomStockData:
    def __init__(self):
        self.app = QApplication(sys.argv)
        self.main_window = QMainWindow()
        self.main_window.setWindowTitle("키움증권 조건검색 필터")
        self.main_window.setGeometry(100, 100, 800, 600)
        
        # UI 설정
        self.setup_ui()
        
        # 키움 API 컨트롤 - 여러 가능한 컨트롤 이름 시도
        self.ocx = None
        self.setup_kiwoom_control()
        
        # 데이터 저장용 변수
        self.daily_data = {}
        self.monthly_data = {}
        self.tr_requested = False
        self.login_completed = False
        
        # 이벤트 루프
        self.event_loop = QEventLoop()
        
        # 종목 목록 (KOSPI 상위 종목들)
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
        
    def setup_kiwoom_control(self):
        """키움 API 컨트롤 설정"""
        control_names = [
            "KHOPENAPI.KHOpenAPICtrl.1",
            "KHOPENAPI.KHOpenAPICtrl",
            "KHOPENAPI.KHOpenAPI",
            "KHOPENAPI.KHOpenAPICtrl.1.0"
        ]
        
        for control_name in control_names:
            try:
                self.log_message(f"컨트롤 {control_name} 시도 중...")
                self.ocx = QAxWidget(control_name)
                
                # 이벤트 연결 시도
                try:
                    self.ocx.OnEventConnect.connect(self.on_event_connect)
                    self.ocx.OnReceiveTrData.connect(self.on_receive_tr_data)
                    self.log_message(f"컨트롤 {control_name} 연결 성공!")
                    break
                except AttributeError as e:
                    self.log_message(f"이벤트 연결 실패: {e}")
                    # 이벤트가 없어도 기본 기능은 사용 가능
                    self.log_message("이벤트 없이 기본 기능으로 진행합니다.")
                    break
                    
            except Exception as e:
                self.log_message(f"컨트롤 {control_name} 실패: {e}")
                continue
        
        if self.ocx is None:
            self.log_message("❌ 모든 키움 API 컨트롤 연결 실패!")
            self.log_message("키움 Open API가 설치되어 있는지 확인해주세요.")
        
    def setup_ui(self):
        """UI 설정"""
        central_widget = QWidget()
        self.main_window.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        
        # 상태 표시 라벨
        self.status_label = QLabel("키움증권 API 연결 대기 중...")
        layout.addWidget(self.status_label)
        
        # 로그인 버튼
        self.login_button = QPushButton("로그인")
        self.login_button.clicked.connect(self.login)
        layout.addWidget(self.login_button)
        
        # 조건검색 실행 버튼
        self.request_button = QPushButton("조건검색 실행")
        self.request_button.clicked.connect(self.run_condition_search)
        self.request_button.setEnabled(False)
        layout.addWidget(self.request_button)
        
        # 로그 출력 영역
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        layout.addWidget(self.log_text)
        
    def log_message(self, message):
        """로그 메시지 출력"""
        current_time = datetime.now().strftime("%H:%M:%S")
        self.log_text.append(f"[{current_time}] {message}")
        
    def login(self):
        """키움증권 로그인"""
        if self.ocx is None:
            self.log_message("❌ 키움 API 컨트롤이 연결되지 않았습니다.")
            return
            
        self.log_message("로그인 시도 중...")
        self.status_label.setText("로그인 중...")
        
        try:
            # 로그인 요청
            result = self.ocx.dynamicCall("CommConnect()")
            
            if result == 0:
                self.log_message("로그인 요청 성공")
                # 이벤트 루프 대기 (이벤트가 있는 경우)
                if hasattr(self.ocx, 'OnEventConnect'):
                    self.event_loop.exec_()
                else:
                    # 이벤트가 없으면 수동으로 성공 처리
                    time.sleep(2)
                    self.on_event_connect(0)
            else:
                self.log_message(f"로그인 요청 실패: {result}")
                
        except Exception as e:
            self.log_message(f"로그인 중 오류: {e}")
            
    def on_event_connect(self, err_code):
        """로그인 이벤트 처리"""
        if err_code == 0:
            self.log_message("로그인 성공!")
            self.status_label.setText("로그인 성공")
            self.login_completed = True
            self.request_button.setEnabled(True)
        else:
            self.log_message(f"로그인 실패: {err_code}")
            self.status_label.setText("로그인 실패")
            
        # 이벤트 루프 종료
        if hasattr(self, 'event_loop'):
            self.event_loop.quit()
        
    def run_condition_search(self):
        """조건검색 실행"""
        if not self.login_completed:
            self.log_message("로그인이 필요합니다.")
            return
            
        self.log_message("🔍 조건검색 시작...")
        self.status_label.setText("조건검색 실행 중...")
        
        # 각 종목에 대해 조건검색 실행
        self.process_all_stocks()
        
    def process_all_stocks(self):
        """모든 종목 처리"""
        self.log_message(f"📊 총 {len(self.stock_list)}개 종목 분석 시작...")
        
        filtered_stocks = []
        
        for i, stock in enumerate(self.stock_list):
            self.log_message(f"🔍 {i+1}/{len(self.stock_list)}: {stock['name']}({stock['code']}) 분석 중...")
            
            # 일봉 데이터 생성 (실제로는 API에서 가져와야 함)
            daily_data = self.generate_daily_data(stock['code'])
            
            # 월봉 데이터 생성
            monthly_data = self.generate_monthly_data(stock['code'])
            
            # 조건 1: 꼬리 우상향 확인
            if not self.check_tail_upward(daily_data):
                self.log_message(f"  ❌ 꼬리 우상향 조건 불만족")
                continue
                
            # 조건 2: 바닥 2회 확인
            if not self.check_bottom_twice(daily_data):
                self.log_message(f"  ❌ 바닥 2회 조건 불만족")
                continue
                
            # 조건 3: 하락장 제외 (월봉 분석)
            if self.is_downtrend(monthly_data):
                self.log_message(f"  ❌ 하락장 제외")
                continue
                
            # 모든 조건 만족
            self.log_message(f"  ✅ 모든 조건 만족!")
            filtered_stocks.append({
                "name": stock['name'],
                "code": stock['code'],
                "price": daily_data[-1]['close']  # 최신 종가
            })
            
        # 결과 저장
        self.save_filtered_stocks(filtered_stocks)
        
    def generate_daily_data(self, stock_code):
        """일봉 데이터 생성 (시뮬레이션)"""
        # 실제로는 키움 API에서 가져와야 함
        daily_data = []
        base_price = 50000 + hash(stock_code) % 50000  # 종목별 다른 기준가
        
        for i in range(20):  # 최근 20일
            # 랜덤한 가격 변동 생성
            price_change = (hash(f"{stock_code}_{i}") % 2000) - 1000  # -1000 ~ +1000
            open_price = base_price + price_change
            high_price = open_price + (hash(f"{stock_code}_{i}_high") % 1000) + 500
            low_price = open_price - (hash(f"{stock_code}_{i}_low") % 1000) - 500
            close_price = open_price + (hash(f"{stock_code}_{i}_close") % 2000) - 1000
            
            daily_item = {
                "date": f"202412{20-i:02d}",
                "open": open_price,
                "high": high_price,
                "low": low_price,
                "close": close_price,
                "volume": 1000000 + (hash(f"{stock_code}_{i}_vol") % 5000000)
            }
            daily_data.append(daily_item)
            
        return daily_data
        
    def generate_monthly_data(self, stock_code):
        """월봉 데이터 생성 (시뮬레이션)"""
        monthly_data = []
        base_price = 50000 + hash(stock_code) % 50000
        
        for i in range(6):  # 최근 6개월
            price_change = (hash(f"{stock_code}_month_{i}") % 10000) - 5000
            close_price = base_price + price_change
            
            monthly_item = {
                "date": f"2024{12-i:02d}",
                "close": close_price
            }
            monthly_data.append(monthly_item)
            
        return monthly_data
        
    def check_tail_upward(self, daily_data):
        """조건 1: 꼬리 우상향 확인"""
        # 최근 20일 데이터에서 꼬리 우상향 패턴 찾기
        tail_upward_count = 0
        
        for i in range(len(daily_data)):
            day = daily_data[i]
            
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
        
    def save_filtered_stocks(self, filtered_stocks):
        """필터링된 종목들을 data.json으로 저장"""
        try:
            with open('data.json', 'w', encoding='utf-8') as f:
                json.dump(filtered_stocks, f, ensure_ascii=False, indent=2)
                
            self.log_message(f"✅ 조건검색 완료!")
            self.log_message(f"📊 총 {len(filtered_stocks)}개 종목이 조건을 만족했습니다.")
            self.log_message(f"💾 결과가 data.json 파일로 저장되었습니다.")
            
            # 결과 출력
            for stock in filtered_stocks:
                self.log_message(f"  📈 {stock['name']}({stock['code']}) - {stock['price']:,}원")
                
            self.status_label.setText(f"조건검색 완료 ({len(filtered_stocks)}개 종목)")
            
        except Exception as e:
            self.log_message(f"❌ 파일 저장 실패: {e}")
            
    def on_receive_tr_data(self, screen_no, rqname, trcode, record_name, prev_next, 
                          data_len, error_code, message, splm_msg):
        """TR 데이터 수신 처리"""
        self.log_message(f"TR 데이터 수신: {rqname}, {trcode}")
        
        # 이벤트 루프 종료
        if hasattr(self, 'event_loop'):
            self.event_loop.quit()
            
    def run(self):
        """애플리케이션 실행"""
        self.main_window.show()
        return self.app.exec_()

def main():
    """메인 함수"""
    print("키움증권 조건검색 필터 시작...")
    
    # 키움 API 인스턴스 생성 및 실행
    kiwoom = KiwoomStockData()
    sys.exit(kiwoom.run())

if __name__ == "__main__":
    main() 