document.addEventListener('DOMContentLoaded', function() {
    // --- 1. Create and inject HTML elements into the body ---

    const fab = document.createElement('button');
    fab.className = 'ai-tutor-fab';
    fab.innerHTML = '<i class="fa-solid fa-robot"></i>';
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

    // --- 2. Get references to all interactive elements ---
    const apiKeyModal = document.getElementById('api-key-modal');
    const chatWin = document.getElementById('chat-window');
    const quickActionsContainer = document.getElementById('quick-actions');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    // --- 3. UI interaction logic (without real AI functionality yet) ---
    fab.addEventListener('click', () => {
        // This will be smarter later. For now, it just opens the API modal.
        apiKeyModal.classList.add('visible');
    });

    document.getElementById('close-chat-btn').addEventListener('click', () => {
        chatWin.classList.remove('visible');
    });

    document.getElementById('validate-api-key-btn').addEventListener('click', () => {
        // Placeholder logic:
        apiKeyModal.classList.remove('visible');
        chatWin.classList.add('visible');
        document.getElementById('api-status').textContent = '✅';
    });
    
    // *** NEW: Central handler for all quick action buttons ***
    quickActionsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('quick-action-btn')) {
            const action = event.target.dataset.action;
            let userMessage = '';
            
            // Create user-facing message based on the button clicked
            switch (action) {
                case 'summarize':
                    userMessage = 'Please summarize this content for me.';
                    break;
                case 'explain':
                    userMessage = 'Can you explain this in more detail?';
                    break;
                case 'quiz':
                    userMessage = 'Quiz me on this topic.';
                    break;
                case 'feynman':
                    userMessage = 'Explain this to me using the Feynman Technique.';
                    break;
            }
            
            addMessageToChat(userMessage, 'user');
            // This is a placeholder for the AI's response
            setTimeout(() => {
                addMessageToChat(`Sure! I will ${action} this content for you once I'm fully connected.`, 'ai');
            }, 500);
        }
    });
    
    // --- 4. Helper Functions ---
    function addMessageToChat(message, sender) {
        const chatArea = document.getElementById('chat-area');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender === 'user' ? 'user-bubble' : 'ai-bubble'}`;
        bubble.textContent = message;
        chatArea.appendChild(bubble);
        // Auto-scroll to the latest message
        chatArea.scrollTop = chatArea.scrollHeight;
    }
});
