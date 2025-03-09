from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
import google.ai.generativelanguage as glm
import os
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

# Flask 앱 초기화
app = Flask(__name__)

# Gemini API 키 설정 (실제 사용 시 .env 파일에 API_KEY를 저장하세요)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Gemini 모델 설정
# 최신 Gemini 모델명 사용 (2025년 3월 기준)
model = genai.GenerativeModel('gemini-2.0-flash')

# 대화 기록을 저장할 세션 관리 (실제 앱에서는 더 견고한 세션 관리가 필요합니다)
chat_sessions = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    session_id = data.get('session_id', 'default')
    
    # 새 세션인 경우 대화 초기화
    if session_id not in chat_sessions:
        try:
            chat_sessions[session_id] = model.start_chat(history=[])
        except Exception as e:
            # 모델 시작에 실패한 경우 사용 가능한 모델 목록 확인
            try:
                available_models = genai.list_models()
                model_names = [model.name for model in available_models]
                return jsonify({
                    'error': f"모델 초기화 오류: {str(e)}. 사용 가능한 모델: {model_names}"
                }), 500
            except:
                return jsonify({
                    'error': f"모델 초기화 오류: {str(e)}"
                }), 500

    
    chat_session = chat_sessions[session_id]
    
    try:
        # Gemini API로 응답 생성
        response = chat_session.send_message(user_message)
        
        return jsonify({
            'response': response.text,
            'session_id': session_id
        })
    except Exception as e:
        # 오류 발생 시 더 자세한 정보 제공
        error_msg = str(e)
        try:
            # 사용 가능한 모델 목록 확인
            available_models = genai.list_models()
            model_names = [model.name for model in available_models]
            error_msg += f". 사용 가능한 모델: {model_names}"
        except:
            pass
            
        return jsonify({
            'error': error_msg
        }), 500

@app.route('/api/reset', methods=['POST'])
def reset_chat():
    data = request.json
    session_id = data.get('session_id', 'default')
    
    # 세션 초기화
    if session_id in chat_sessions:
        del chat_sessions[session_id]
    
    return jsonify({'status': 'Chat reset successfully'})

if __name__ == '__main__':
    app.run(debug=True)