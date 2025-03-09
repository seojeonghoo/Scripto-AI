document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    // 세션 ID 생성 (실제 앱에서는 더 견고한 방식을 사용하세요)
    let sessionId = Date.now().toString();
    
    // 메시지 전송 함수
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message.length === 0) return;
        
        // 사용자 메시지 UI에 추가
        addMessageToUI('user', message);
        
        // 입력 필드 초기화
        chatInput.value = '';
        
        // 로딩 표시 추가
        const loadingEl = addLoadingIndicator();
        
        // API 호출
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                session_id: sessionId
            }),
        })
        .then(response => response.json())
        .then(data => {
            // 로딩 표시 제거
            loadingEl.remove();
            
            if (data.error) {
                addMessageToUI('bot', '죄송합니다, 오류가 발생했습니다: ' + data.error);
            } else {
                addMessageToUI('bot', data.response);
            }
        })
        .catch(error => {
            // 로딩 표시 제거
            loadingEl.remove();
            addMessageToUI('bot', '죄송합니다, 서버 통신 중 오류가 발생했습니다.');
            console.error('Error:', error);
        });
    }
    
    // UI에 메시지 추가
    function addMessageToUI(sender, content) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${sender}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        messageEl.appendChild(messageContent);
        chatMessages.appendChild(messageEl);
        
        // 스크롤을 아래로 이동
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 로딩 표시 추가
    function addLoadingIndicator() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'message bot loading';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            loadingEl.appendChild(dot);
        }
        
        chatMessages.appendChild(loadingEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return loadingEl;
    }
    
    // 대화 초기화
    function resetChat() {
        fetch('/api/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId
            }),
        })
        .then(() => {
            // 세션 ID 갱신
            sessionId = Date.now().toString();
            
            // UI 초기화
            chatMessages.innerHTML = '';
            
            // 초기 메시지 추가
            addMessageToUI('bot', '안녕하세요! 무엇을 도와드릴까요? 😊');
        })
        .catch(error => {
            console.error('Error resetting chat:', error);
        });
    }
    
    // 이벤트 리스너
    sendBtn.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 텍스트 영역 자동 크기 조절
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        const newHeight = Math.min(this.scrollHeight, 150);
        this.style.height = newHeight + 'px';
    });
    
    resetBtn.addEventListener('click', resetChat);
});