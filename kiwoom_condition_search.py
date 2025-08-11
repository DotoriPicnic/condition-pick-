import sys
import time
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QEventLoop, QTimer
from pykiwoom.kiwoom import *


class KiwoomConditionSearch:
    def __init__(self):
        self.app = QApplication(sys.argv)
        self.kiwoom = Kiwoom()
        self.connected = False
        self.logged_in = False
        self.condition_received = False
        self.condition_result = []
        
        # 이벤트 핸들러 설정 (pykiwoom 방식)
        print("🔧 이벤트 핸들러 설정 중...")
        try:
            self.kiwoom.OnEventConnect = self.on_event_connect
            self.kiwoom.OnReceiveConditionVer = self.on_receive_condition_ver
            self.kiwoom.OnReceiveTrCondition = self.on_receive_tr_condition
            self.kiwoom.OnReceiveRealCondition = self.on_receive_real_condition
            print("✅ 이벤트 핸들러 설정 완료")
        except Exception as e:
            print(f"⚠️ 이벤트 핸들러 설정 오류: {e}")
    
    def on_event_connect(self, err_code):
        """로그인 이벤트 핸들러"""
        print(f"🔍 연결 이벤트 수신: 에러코드 = {err_code}")
        if err_code == 0:
            self.connected = True
            print("✅ 키움증권 API 연결 성공")
        else:
            self.connected = False
            print(f"❌ 키움증권 API 연결 실패 (에러코드: {err_code})")
    
    def on_receive_condition_ver(self, ret, msg):
        """조건식 목록 수신 이벤트 핸들러"""
        print(f"📋 조건식 버전 수신: ret={ret}, msg={msg}")
        if ret == 1:
            print("✅ 조건식 목록 수신 성공")
        else:
            print(f"❌ 조건식 목록 수신 실패: {msg}")
    
    def on_receive_tr_condition(self, screen_no, codes, condition_name, index, next):
        """조건검색 결과 수신 이벤트 핸들러"""
        print(f"📊 조건검색 결과 수신: {condition_name}")
        print(f"   스크린번호: {screen_no}, 인덱스: {index}, 다음: {next}")
        print(f"   종목코드: {codes}")
        
        if codes:
            code_list = codes.split(';')
            for code in code_list:
                if code.strip():
                    # 종목명 조회
                    stock_name = self.kiwoom.GetMasterCodeName(code)
                    self.condition_result.append({
                        'code': code,
                        'name': stock_name
                    })
                    print(f"  📈 {code} - {stock_name}")
        
        self.condition_received = True
    
    def on_receive_real_condition(self, code, type, condition_name, condition_index):
        """실시간 조건검색 결과 수신 이벤트 핸들러"""
        stock_name = self.kiwoom.GetMasterCodeName(code)
        if type == "I":  # 편입
            print(f"🟢 실시간 편입: {code} - {stock_name}")
        elif type == "D":  # 이탈
            print(f"🔴 실시간 이탈: {code} - {stock_name}")
    
    def connect(self):
        """키움증권 API 연결"""
        print("🔗 키움증권 API 연결 시도...")
        
        # 연결 상태 확인
        current_state = self.kiwoom.GetConnectState()
        print(f"🔍 현재 연결 상태: {current_state}")
        
        if current_state == 1:
            print("✅ 이미 연결되어 있습니다.")
            self.connected = True
            return True
        
        # API 연결
        try:
            self.kiwoom.CommConnect(block=True)
            print("📡 CommConnect 호출 완료")
        except Exception as e:
            print(f"❌ CommConnect 오류: {e}")
            return False
        
        # 연결 상태 확인을 위한 대기
        print("⏳ 연결 상태 확인 중...")
        for i in range(10):  # 최대 10초 대기
            time.sleep(1)
            current_state = self.kiwoom.GetConnectState()
            print(f"🔍 연결 상태 확인 {i+1}/10: {current_state}")
            
            if current_state == 1:
                self.connected = True
                print("✅ 키움증권 API 연결 성공")
                return True
        
        print("❌ 연결 시간 초과")
        return False
    
    def login(self, user_id, password, cert_password=""):
        """키움증권 로그인"""
        if not self.connected:
            print("❌ API가 연결되지 않았습니다.")
            return False
        
        print(f"🔐 로그인 시도: {user_id}")
        
        try:
            # pykiwoom에서는 CommConnect로 로그인을 처리
            # 이미 연결되어 있으므로 로그인 상태만 확인
            print("📡 로그인 상태 확인 중...")
            
            # 로그인 완료 대기
            print("⏳ 로그인 완료 대기 중...")
            for i in range(15):  # 최대 15초 대기
                time.sleep(1)
                login_state = self.kiwoom.GetConnectState()
                print(f"🔍 로그인 상태 확인 {i+1}/15: {login_state}")
                
                if login_state == 1:
                    try:
                        login_user_id = self.kiwoom.GetLoginInfo("USER_ID")
                        print(f"✅ 로그인 성공: {login_user_id}")
                        self.logged_in = True
                        return True
                    except Exception as e:
                        print(f"⚠️ GetLoginInfo 오류: {e}")
                        # 로그인 상태가 1이면 로그인된 것으로 간주
                        print("✅ 로그인 상태 확인됨")
                        self.logged_in = True
                        return True
            
            print("❌ 로그인 시간 초과")
            return False
            
        except Exception as e:
            print(f"❌ Login 오류: {e}")
            return False
    
    def get_condition_list(self):
        """조건식 목록 조회"""
        if not self.logged_in:
            print("❌ 로그인이 필요합니다.")
            return []
        
        print("📋 조건식 목록 조회...")
        
        try:
            self.kiwoom.GetConditionLoad()
            print("📡 GetConditionLoad 호출 완료")
        except Exception as e:
            print(f"❌ GetConditionLoad 오류: {e}")
            return []
        
        # 조건식 목록 수신 대기
        print("⏳ 조건식 목록 수신 대기 중...")
        for i in range(10):  # 최대 10초 대기
            time.sleep(1)
            print(f"🔍 조건식 목록 대기 {i+1}/10")
        
        # 조건식 목록 가져오기
        try:
            condition_list = self.kiwoom.GetConditionNameList()
            print(f"📋 조건식 목록: {condition_list}")
            
            if condition_list:
                # 조건식이 리스트인 경우
                if isinstance(condition_list, list):
                    print("📋 저장된 조건식 목록:")
                    for condition in condition_list:
                        if isinstance(condition, tuple) and len(condition) >= 2:
                            index, name = condition[0], condition[1]
                            print(f"  {index}: {name}")
                    return condition_list
                # 조건식이 문자열인 경우
                elif isinstance(condition_list, str):
                    conditions = condition_list.split(';')
                    print("📋 저장된 조건식 목록:")
                    for condition in conditions:
                        if condition.strip():
                            try:
                                index, name = condition.split('^')
                                print(f"  {index}: {name}")
                            except ValueError:
                                print(f"  조건식 파싱 오류: {condition}")
                    return conditions
                else:
                    print(f"❌ 예상치 못한 조건식 형식: {type(condition_list)}")
                    return []
            else:
                print("❌ 조건식이 없습니다.")
                return []
        except Exception as e:
            print(f"❌ GetConditionNameList 오류: {e}")
            return []
    
    def search_condition(self, condition_index=0, condition_name=""):
        """조건검색 실행"""
        if not self.logged_in:
            print("❌ 로그인이 필요합니다.")
            return []
        
        print(f"🔍 조건검색 실행 (인덱스: {condition_index}, 조건명: {condition_name})...")
        self.condition_result = []
        self.condition_received = False
        
        # 조건검색 실행
        try:
            print(f"📡 SendCondition 호출: 스크린번호=0101, 조건명='{condition_name}', 인덱스={condition_index}, 검색구분=0")
            result = self.kiwoom.SendCondition("0101", condition_name, condition_index, 0)
            print(f"📡 SendCondition 결과: {result} (타입: {type(result)})")
        except Exception as e:
            print(f"❌ SendCondition 오류: {e}")
            return []
        
        # SendCondition 결과 확인
        if isinstance(result, list):
            # 즉시 결과가 반환된 경우
            print("📊 즉시 조건검색 결과 수신")
            if result:
                for code in result:
                    if code.strip():
                        # 종목명 조회
                        stock_name = self.kiwoom.GetMasterCodeName(code)
                        self.condition_result.append({
                            'code': code,
                            'name': stock_name
                        })
                        print(f"  📈 {code} - {stock_name}")
                
                print(f"📊 조건검색 완료: {len(self.condition_result)}개 종목")
                return self.condition_result
            else:
                print("❌ 조건검색 결과가 없습니다.")
                print("💡 가능한 원인:")
                print("  1. 조건식에 해당하는 종목이 없음")
                print("  2. 조건식이 제대로 설정되지 않음")
                print("  3. 거래 시간이 아님 (09:00~15:30)")
                return []
        elif result == 1 or result == 0:  # 성공 또는 대기
            print("✅ 조건검색 요청 성공 (이벤트 대기)")
            
            # 결과 수신 대기
            print("⏳ 조건검색 결과 수신 대기 중...")
            for i in range(15):  # 최대 15초 대기
                time.sleep(1)
                print(f"🔍 조건검색 결과 대기 {i+1}/15 (수신상태: {self.condition_received})")
                
                if self.condition_received:
                    print(f"📊 조건검색 완료: {len(self.condition_result)}개 종목")
                    return self.condition_result
            
            print("❌ 조건검색 결과 수신 실패")
            print("💡 가능한 원인:")
            print("  1. 조건식에 해당하는 종목이 없음")
            print("  2. 이벤트 핸들러가 호출되지 않음")
            print("  3. 거래 시간이 아님 (09:00~15:30)")
            print("  4. 조건식이 제대로 설정되지 않음")
            return []
        else:
            print(f"❌ 조건검색 요청 실패 (결과: {result})")
            return []
    
    def run(self, user_id, password, cert_password=""):
        """메인 실행 함수"""
        print("🚀 키움증권 조건검색 시작...")
        
        # 1. API 연결
        if not self.connect():
            print("❌ API 연결 실패")
            return False
        
        # 2. 로그인
        if not self.login(user_id, password, cert_password):
            print("❌ 로그인 실패")
            return False
        
        # 3. 조건식 목록 조회
        condition_list = self.get_condition_list()
        
        # 4. 조건검색 실행 (0번 인덱스)
        if condition_list:
            # 조건식 이름 추출
            condition_name = ""
            if isinstance(condition_list, list) and len(condition_list) > 0:
                if isinstance(condition_list[0], tuple) and len(condition_list[0]) >= 2:
                    condition_name = condition_list[0][1]  # 조건식 이름
            
            result = self.search_condition(0, condition_name)
            if result:
                print("\n📈 최종 조건검색 결과:")
                for i, stock in enumerate(result, 1):
                    print(f"  {i:2d}. {stock['code']} - {stock['name']}")
            else:
                print("❌ 조건검색 결과가 없습니다.")
        else:
            print("❌ 조건식이 없어 검색을 실행할 수 없습니다.")
        
        return True


def main():
    """메인 함수"""
    # 키움증권 계정 정보 (실제 계정으로 변경 필요)
    USER_ID = "ysgille"  # 실제 키움증권 아이디
    PASSWORD = "ns703430"  # 실제 키움증권 비밀번호
    CERT_PASSWORD = "ns70343!@#"  # 공동인증서 비밀번호
    
    # 조건검색 실행
    kiwoom_search = KiwoomConditionSearch()
    success = kiwoom_search.run(USER_ID, PASSWORD, CERT_PASSWORD)
    
    if success:
        print("\n✅ 키움증권 조건검색 완료")
    else:
        print("\n❌ 키움증권 조건검색 실패")
    
    # 프로그램 종료
    print("👋 프로그램을 종료합니다.")


if __name__ == "__main__":
    main() 