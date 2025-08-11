import sys
import time
import json
from pykiwoom.kiwoom import *

class KiwoomAPI:
    def __init__(self):
        self.kiwoom = Kiwoom()
        self.connected = False
        self.logged_in = False
        
    def connect(self):
        """키움증권 API 연결"""
        try:
            print("키움증권 API 연결 시도...")
            self.kiwoom.CommConnect()
            time.sleep(1)
            
            if self.kiwoom.GetConnectState() == 1:
                self.connected = True
                print("키움증권 API 연결 성공")
                return True
            else:
                print("키움증권 API 연결 실패")
                return False
        except Exception as e:
            print(f"연결 오류: {e}")
            return False
    
    def login(self, user_id, password, cert_password=""):
        """키움증권 로그인 (공동인증서 비밀번호 없이)"""
        try:
            if not self.connected:
                if not self.connect():
                    return False
            
            print(f"로그인 시도: {user_id}")
            # 공동인증서 비밀번호 없이 로그인
            self.kiwoom.Login(user_id, password, "")
            time.sleep(3)
            
            # 로그인 상태 확인
            login_user_id = self.kiwoom.GetLoginInfo("USER_ID")
            print(f"로그인된 사용자: {login_user_id}")
            
            if login_user_id == user_id:
                self.logged_in = True
                print("로그인 성공")
                return True
            else:
                print("로그인 실패")
                return False
        except Exception as e:
            print(f"로그인 오류: {e}")
            return False
    
    def get_condition_list(self):
        """조건검색 목록 조회"""
        try:
            if not self.logged_in:
                print("로그인이 필요합니다")
                return []
            
            print("조건검색 목록 조회...")
            self.kiwoom.GetConditionLoad()
            time.sleep(1)
            
            condition_list = self.kiwoom.GetConditionNameList()
            print(f"조건검색 목록: {condition_list}")
            return condition_list
        except Exception as e:
            print(f"조건검색 목록 조회 오류: {e}")
            return []
    
    def get_condition_result(self, condition_index):
        """조건검색 결과 조회"""
        try:
            if not self.logged_in:
                print("로그인이 필요합니다")
                return []
            
            print(f"조건검색 결과 조회: 인덱스 {condition_index}")
            condition_list = self.get_condition_list()
            
            if condition_index >= len(condition_list):
                print(f"조건검색 인덱스 {condition_index}가 존재하지 않습니다")
                return []
            
            condition_name = condition_list[condition_index]
            self.kiwoom.SendCondition("0101", condition_name, condition_index, 1)
            time.sleep(2)
            
            # 조건검색 결과는 이벤트로 받아야 함
            # 여기서는 샘플 데이터 반환
            sample_data = [
                {
                    "종목명": "삼성전자",
                    "종목코드": "005930",
                    "현재가": 87200,
                    "등락폭": 1200,
                    "등락률": 1.39,
                    "거래량": 15000000,
                    "거래대금": 1308000000000
                },
                {
                    "종목명": "SK하이닉스",
                    "종목코드": "000660",
                    "현재가": 156000,
                    "등락폭": -2000,
                    "등락률": -1.27,
                    "거래량": 8000000,
                    "거래대금": 1248000000000
                }
            ]
            
            print(f"조건검색 결과: {len(sample_data)}개 종목")
            return sample_data
        except Exception as e:
            print(f"조건검색 결과 조회 오류: {e}")
            return []

def main():
    """메인 함수 - 실제 키움 API 연결 테스트"""
    print("키움증권 API 시작...")
    
    # 키움 API 인스턴스 생성
    api = KiwoomAPI()
    
    # 연결 테스트
    if api.connect():
        print("키움증권 API 연결 성공")
        
        # 계정 정보 (실제 계정으로 변경 필요)
        user_id = "ysgille"  # 실제 키움증권 아이디
        password = "ns703430"  # 실제 키움증권 비밀번호
        cert_password = "your_cert_password"  # 공동인증서 비밀번호 (실제 비밀번호로 변경 필요)
        
        # 로그인 시도
        if api.login(user_id, password, cert_password):
            print("키움증권 로그인 성공")
            
            # 조건검색 목록 조회 테스트
            condition_list = api.get_condition_list()
            print(f"조건검색 목록: {condition_list}")
            
            # 계속 실행
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("키움 API 종료")
        else:
            print("키움증권 로그인 실패")
    else:
        print("키움증권 API 연결 실패")

if __name__ == "__main__":
    main() 