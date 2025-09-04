document.addEventListener('DOMContentLoaded', function() {
    // --- 1. Create and inject HTML elements into the body ---
    const fab = document.createElement('button');
    fab.className = 'ai-tutor-fab';
    fab.innerHTML = '<i class="fa-solid fa-brain"></i>';
    fab.title = 'Open AI Tutor';

    const apiModal = document.createElement('div');
    apiModal.id = 'api-key-modal';
    apiModal.className = 'tutor-modal-overlay';
    apiModal.innerHTML = `
        <div class="tutor-modal-content api-modal">
            <h2>AI Tutor Setup</h2>
            <p>Please enter your Gemini API Key to activate the AI Tutor.</p>
            <input type="password" id="api-key-input" placeholder="Enter your API Key">
            <button id="validate-api-key-btn">Validate & Save Key</button>
            <div id="api-validation-message"></div>
        </div>
    `;

    const chatWindow = document.createElement('div');
    chatWindow.id = 'chat-window';
    chatWindow.className = 'chat-window';
    chatWindow.innerHTML = `
        <div class="chat-header">
            <h3>AI Tutor</h3>
            <div>
                <span id="api-status" class="api-status">❌</span>
                <button id="minimize-chat-btn" title="Minimize">–</button>
                <button id="close-chat-btn" title="Close">X</button>
            </div>
        </div>
        <div class="chat-area" id="chat-area">
            <div class="chat-bubble ai-bubble">
                Hello! I’m your AI Tutor. How can I help you with the content on this page?
            </div>
        </div>
        <div class="chat-input-area">
            <div class="quick-actions" id="quick-actions">
                <button class="quick-action-btn" data-action="summarize">Summarize</button>
                <button class="quick-action-btn" data-action="explain">Explain</button>
                <button class="quick-action-btn" data-action="quiz">Quiz Me</button>
                <button class="quick-action-btn" data-action="feynman">Feynman Technique</button>
            </div>
            <div class="input-wrapper">
                <input type="text" id="chat-input" placeholder="Ask a question...">
                <button id="chat-send-btn" title="Send"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(apiModal);
    document.body.appendChild(chatWindow);

    // --- 2. Get references and setup state ---
    const apiKeyModal = document.getElementById('api-key-modal');
    const chatWin = document.getElementById('chat-window');
    const apiStatus = document.getElementById('api-status');
    const quickActionsContainer = document.getElementById('quick-actions');
    const GEMINI_API_KEY_STORAGE = 'gemini_api_key';

    // --- 3. Core Logic: API Key Management & UI Toggling ---
    function initializeTutor() {
        const savedApiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE);
        if (savedApiKey) {
            chatWin.classList.toggle('visible');
            apiStatus.textContent = '✅';
        } else {
            apiKeyModal.classList.add('visible');
        }
    }
    
    fab.addEventListener('click', initializeTutor);
    
    document.getElementById('close-chat-btn').addEventListener('click', () => {
        chatWin.classList.remove('visible');
    });

    document.getElementById('validate-api-key-btn').addEventListener('click', () => {
        const apiKey = document.getElementById('api-key-input').value;
        const validationMsg = document.getElementById('api-validation-message');
        if (apiKey && apiKey.length > 10) {
            localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
            validationMsg.textContent = '✅ API connected successfully!';
            validationMsg.className = 'success';
            setTimeout(() => {
                apiKeyModal.classList.remove('visible');
                chatWin.classList.add('visible');
                apiStatus.textContent = '✅';
            }, 1000);
        } else {
            validationMsg.textContent = '❌ Invalid API key, please try again.';
            validationMsg.className = 'error';
        }
    });

    // --- 4. Smart Prompt Handling ---
    quickActionsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('quick-action-btn')) {
            const action = event.target.dataset.action;
            
            // *** هذا هو التعديل المهم ***
            // لاحظ أننا لم نعد نستخدم دالة addMessageToChat الخاصة بالطالب
            // نحن نرسل الأمر مباشرة للذكاء الاصطناعي (مستقبلاً)
            // ونظهر فقط رسالة مؤقتة من الذكاء الاصطناعي
            
            addMessageToChat(`Running "${event.target.textContent}"...`, 'ai');
            
            // هنا سنضع الكود الذي يرسل الأمر "explain" أو "summarize" إلى Gemini API
        }
    });

    // --- 5. Helper Functions ---
    function addMessageToChat(message, sender) {
        const chatArea = document.getElementById('chat-area');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender === 'user' ? 'user-bubble' : 'ai-bubble'}`;
        bubble.textContent = message;
        chatArea.appendChild(bubble);
        chatArea.scrollTop = chatArea.scrollHeight;
    }
});
