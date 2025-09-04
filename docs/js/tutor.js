document.addEventListener('DOMContentLoaded', function() {
    // --- 1. HTML Injection & Element Setup ---
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
            <p>Please enter your Gemini API Key to activate the AI Tutor. You can get one from Google AI Studio.</p>
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
                <button id="close-chat-btn" title="Close">X</button>
            </div>
        </div>
        <div class="chat-area" id="chat-area">
            <div class="chat-bubble ai-bubble">
                Hello! I am ready to help. Ask me a question or use the quick actions below.
            </div>
        </div>
        <div class="chat-input-area">
            <div class="quick-actions" id="quick-actions">
                <button class="quick-action-btn" data-prompt="Summarize the following content concisely.">Summarize</button>
                <button class="quick-action-btn" data-prompt="Explain the following content in a simple way, as if you were teaching a fellow medical student.">Explain</button>
                <button class="quick-action-btn" data-prompt="Based on the following content, ask me one multiple-choice question to test my understanding.">Quiz Me</button>
                <button class="quick-action-btn" data-prompt="Explain the following content using the Feynman Technique: simplify the core concept, use an analogy, and then ask a question to check for understanding.">Feynman Technique</button>
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

    // --- 2. Get References and Setup State ---
    const apiKeyModal = document.getElementById('api-key-modal');
    const chatWin = document.getElementById('chat-window');
    const apiStatus = document.getElementById('api-status');
    const chatArea = document.getElementById('chat-area');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const quickActionsContainer = document.getElementById('quick-actions');
    const GEMINI_API_KEY_STORAGE = 'gemini_api_key';
    let genAI; // Will hold the Gemini AI instance

    // --- 3. Core Logic: API Key & Initialization ---
    function initializeTutor() {
        const savedApiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE);
        if (savedApiKey) {
            try {
                genAI = new google.generativeai.GoogleGenerativeAI(savedApiKey);
                apiStatus.textContent = '✅';
                chatWin.classList.toggle('visible');
            } catch (error) {
                console.error("AI Initialization failed:", error);
                localStorage.removeItem(GEMINI_API_KEY_STORAGE);
                apiKeyModal.classList.add('visible');
            }
        } else {
            apiKeyModal.classList.add('visible');
        }
    }
    
    async function validateAndSaveApiKey() {
        const apiKey = document.getElementById('api-key-input').value;
        const validationMsg = document.getElementById('api-validation-message');
        if (!apiKey) {
            validationMsg.textContent = '❌ Please enter a key.';
            validationMsg.className = 'error';
            return;
        }

        validationMsg.textContent = 'Validating...';
        validationMsg.className = '';

        try {
            const testAI = new google.generativeai.GoogleGenerativeAI(apiKey);
            const model = testAI.getGenerativeModel({ model: "gemini-pro" });
            await model.generateContent("Test"); // Simple API call to validate

            localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
            genAI = testAI; // Set the main AI instance
            validationMsg.textContent = '✅ API connected successfully!';
            validationMsg.className = 'success';
            setTimeout(() => {
                apiKeyModal.classList.remove('visible');
                chatWin.classList.add('visible');
                apiStatus.textContent = '✅';
            }, 1000);
        } catch (error) {
            console.error("API Key Validation Error:", error);
            validationMsg.textContent = '❌ Invalid API key, please try again.';
            validationMsg.className = 'error';
        }
    }

    // --- 4. Context Awareness ---
    function getPageContext() {
        let context = "No specific context found on this page.";
        const path = window.location.pathname;

        if (path.includes('lesson.html')) {
            const content = document.getElementById('content-container')?.innerText;
            if(content) context = `This is a lesson page. The content is:\n\n---\n${content}\n---`;
        } else if (path.includes('quiz.html')) {
            const question = document.getElementById('question-stem')?.innerText;
            if(question) context = `This is a quiz page. The current question is:\n\n---\n${question}\n---`;
        } else if (path.includes('flashcards.html')) {
            const front = document.getElementById('card-front-content')?.innerText;
            const back = document.getElementById('card-back-content')?.innerText;
            if(front) context = `This is a flashcard page. The front of the card says: "${front}". The back says: "${back}".`;
        }
        return context;
    }

    // --- 5. Main AI Interaction Function ---
    async function sendMessageToAI(prompt) {
        if (!genAI) {
            addMessageToChat("AI is not initialized. Please check your API Key.", 'ai');
            return;
        }

        const thinkingBubble = addMessageToChat("Thinking...", 'ai');
        
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const pageContext = getPageContext();

            const fullPrompt = `
                **Behavior Rules:**
                - You are an expert medical tutor. Your role is to explain, connect ideas, and answer with clear clinical logic.
                - ALWAYS explain in English.
                - If the user asks for Arabic, you MUST explain in Arabic but KEEP all medical terms in English without translation.

                **Page Context:**
                ${pageContext}

                **User's Request:**
                ${prompt}
            `;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();
            
            thinkingBubble.textContent = text; // Update the "Thinking..." bubble with the real answer

        } catch (error) {
            console.error("Error communicating with Gemini:", error);
            thinkingBubble.textContent = "Sorry, I encountered an error. Please check the console or try again.";
        }
    }

    // --- 6. Event Listeners ---
    fab.addEventListener('click', initializeTutor);
    document.getElementById('validate-api-key-btn').addEventListener('click', validateAndSaveApiKey);
    document.getElementById('close-chat-btn').addEventListener('click', () => chatWin.classList.remove('visible'));

    sendBtn.addEventListener('click', () => {
        const userInput = chatInput.value.trim();
        if (userInput) {
            addMessageToChat(userInput, 'user');
            sendMessageToAI(userInput);
            chatInput.value = '';
        }
    });
    
    chatInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') sendBtn.click();
    });

    quickActionsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('quick-action-btn')) {
            const prompt = event.target.dataset.prompt;
            sendMessageToAI(prompt);
        }
    });
    
    // --- 7. Helper Functions ---
    function addMessageToChat(message, sender) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender === 'user' ? 'user-bubble' : 'ai-bubble'}`;
        bubble.textContent = message;
        chatArea.appendChild(bubble);
        chatArea.scrollTop = chatArea.scrollHeight;
        return bubble;
    }
});
