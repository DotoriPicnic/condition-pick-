import sys
import time
import json
import locale

# 한글 인코딩 설정
if sys.platform.startswith('win'):
    # Windows에서 한글 인코딩 설정
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    locale.setlocale(locale.LC_ALL, 'Korean_Korea.UTF-8')

from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QEventLoop, QTimer
from pykiwoom.kiwoom import *


class KiwoomConditionAPI:
    def __init__(self):
        self.app = QApplication(sys.argv)
        self.kiwoom = Kiwoom()
        self.connected = False
        self.logged_in = False
        self.condition_received = False
        self.condition_result = []
        
        # 이벤트 핸들러 설정
        self.kiwoom.OnEventConnect = self.on_event_connect
        self.kiwoom.OnReceiveConditionVer = self.on_receive_condition_ver
        self.kiwoom.OnReceiveTrCondition = self.on_receive_tr_condition
        self.kiwoom.OnReceiveRealCondition = self.on_receive_real_condition
    
    def on_event_connect(self, err_code):
        """로그인 이벤트 핸들러"""
        if err_code == 0:
            self.connected = True
        else:
            self.connected = False
    
    def on_receive_condition_ver(self, ret, msg):
        """조건식 목록 수신 이벤트 핸들러"""
        pass
    
    def on_receive_tr_condition(self, screen_no, codes, condition_name, index, next):
        """조건검색 결과 수신 이벤트 핸들러"""
        if codes:
            code_list = codes.split(';')
            for code in code_list:
                if code.strip():
                    stock_name = self.kiwoom.GetMasterCodeName(code)
                    self.condition_result.append({
                        'code': code,
                        'name': stock_name
                    })
        self.condition_received = True
    
    def on_receive_real_condition(self, code, type, condition_name, condition_index):
        """실시간 조건검색 결과 수신 이벤트 핸들러"""
        pass
    
    def connect(self):
        """키움증권 API 연결"""
        current_state = self.kiwoom.GetConnectState()
        
        if current_state == 1:
            self.connected = True
            return True
        
        try:
            self.kiwoom.CommConnect(block=True)
            
            for i in range(10):
                time.sleep(1)
                current_state = self.kiwoom.GetConnectState()
                
                if current_state == 1:
                    self.connected = True
                    return True
            
            return False
            
        except Exception as e:
            return False
    
    def login(self, user_id, password, cert_password=""):
        """키움증권 로그인"""
        if not self.connected:
            return False
        
        try:
            for i in range(15):
                time.sleep(1)
                login_state = self.kiwoom.GetConnectState()
                
                if login_state == 1:
                    self.logged_in = True
                    return True
            
            return False
            
        except Exception as e:
            return False
    
    def get_condition_list(self):
        """조건식 목록 조회"""
        if not self.logged_in:
            return []
        
        try:
            self.kiwoom.GetConditionLoad()
            
            for i in range(10):
                time.sleep(1)
            
            condition_list = self.kiwoom.GetConditionNameList()
            
            if condition_list:
                if isinstance(condition_list, list):
                    return condition_list
                elif isinstance(condition_list, str):
                    conditions = condition_list.split(';')
                    return conditions
                else:
                    return []
            else:
                return []
        except Exception as e:
            return []
    
    def search_condition(self, condition_index=0, condition_name=""):
        """조건검색 실행"""
        if not self.logged_in:
            return []
        
        self.condition_result = []
        self.condition_received = False
        
        try:
            result = self.kiwoom.SendCondition("0101", condition_name, condition_index, 0)
            
            if isinstance(result, list):
                # 즉시 결과가 반환된 경우
                for code in result:
                    if code.strip():
                        stock_name = self.kiwoom.GetMasterCodeName(code)
                        self.condition_result.append({
                            'code': code,
                            'name': stock_name
                        })
                return self.condition_result
            elif result == 1 or result == 0:
                # 이벤트 대기
                for i in range(15):
                    time.sleep(1)
                    
                    if self.condition_received:
                        return self.condition_result
                
                return []
            else:
                return []
        except Exception as e:
            return []
    
    def run_condition_search(self, user_id, password, cert_password="", condition_index=0):
        """조건검색 실행 메인 함수"""
        # 1. API 연결
        if not self.connect():
            return {"success": False, "error": "API 연결 실패"}
        
        # 2. 로그인
        if not self.login(user_id, password, cert_password):
            return {"success": False, "error": "로그인 실패"}
        
        # 3. 조건식 목록 조회
        condition_list = self.get_condition_list()
        
        if not condition_list:
            return {"success": False, "error": "조건식이 없습니다"}
        
        # 4. 조건검색 실행
        condition_name = ""
        if isinstance(condition_list, list) and len(condition_list) > 0:
            if isinstance(condition_list[0], tuple) and len(condition_list[0]) >= 2:
                condition_name = condition_list[0][1]
        
        result = self.search_condition(condition_index, condition_name)
        
        return {
            "success": True,
            "condition_name": condition_name,
            "result": result,
            "count": len(result)
        }


# 전역 변수로 API 인스턴스 관리
kiwoom_api = None


def get_kiwoom_api():
    """키움 API 인스턴스 반환"""
    global kiwoom_api
    if kiwoom_api is None:
        kiwoom_api = KiwoomConditionAPI()
    return kiwoom_api


def run_condition_search_api(user_id, password, cert_password="", condition_index=0):
    """웹 API용 조건검색 실행 함수"""
    try:
        api = get_kiwoom_api()
        return api.run_condition_search(user_id, password, cert_password, condition_index)
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    # 테스트용
    USER_ID = "ysgille"
    PASSWORD = "ns703430"
    CERT_PASSWORD = "ns70343!@#"
    
    result = run_condition_search_api(USER_ID, PASSWORD, CERT_PASSWORD, 0)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0)  # 정상 종료 