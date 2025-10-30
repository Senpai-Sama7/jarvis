// State
let serverUrl = '';
let apiKey = '';
let isConnected = false;

// Elements
const connectionPanel = document.getElementById('connectionPanel');
const mainApp = document.getElementById('mainApp');
const connectionForm = document.getElementById('connectionForm');
const messages = document.getElementById('messages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const codeInput = document.getElementById('codeInput');
const executeBtn = document.getElementById('executeBtn');
const languageSelect = document.getElementById('languageSelect');
const executeOutput = document.getElementById('executeOutput');
const fileList = document.getElementById('fileList');
const refreshFiles = document.getElementById('refreshFiles');
const terminalOutput = document.getElementById('terminalOutput');
const terminalInput = document.getElementById('terminalInput');
const disconnectBtn = document.getElementById('disconnectBtn');

// API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const options = {
        method,
        headers,
        mode: 'cors'
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${serverUrl}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Connection
connectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    serverUrl = document.getElementById('serverUrl').value.trim();
    apiKey = document.getElementById('apiKey').value.trim();
    
    // Remove trailing slash
    if (serverUrl.endsWith('/')) {
        serverUrl = serverUrl.slice(0, -1);
    }
    
    try {
        // Test connection
        const response = await apiCall('/health');
        
        if (response.status === 'ok') {
            isConnected = true;
            connectionPanel.classList.add('hidden');
            mainApp.classList.remove('hidden');
            
            // Save to localStorage
            localStorage.setItem('jarvis_server', serverUrl);
            if (apiKey) {
                localStorage.setItem('jarvis_key', apiKey);
            }
            
            addMessage('System', 'Connected to JARVIS server', 'assistant');
        }
    } catch (error) {
        alert('Failed to connect. Check your server URL and try again.');
    }
});

// Load saved connection
window.addEventListener('load', () => {
    const saved = localStorage.getItem('jarvis_server');
    const savedKey = localStorage.getItem('jarvis_key');
    
    if (saved) {
        document.getElementById('serverUrl').value = saved;
    }
    if (savedKey) {
        document.getElementById('apiKey').value = savedKey;
    }
});

// Disconnect
disconnectBtn.addEventListener('click', () => {
    isConnected = false;
    mainApp.classList.add('hidden');
    connectionPanel.classList.remove('hidden');
});

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        
        // Update active nav
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active view
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');
    });
});

// Chat
function addMessage(role, content, type = 'user') {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.innerHTML = `<strong>${role}:</strong><br>${content.replace(/\n/g, '<br>')}`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}

sendBtn.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (!message) return;
    
    addMessage('You', message, 'user');
    chatInput.value = '';
    
    try {
        const response = await apiCall('/api/chat', 'POST', { message });
        addMessage('JARVIS', response.response, 'assistant');
    } catch (error) {
        addMessage('Error', 'Failed to get response', 'assistant');
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

// Voice Input
voiceBtn.addEventListener('click', () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            sendBtn.click();
        };
        
        recognition.start();
        voiceBtn.textContent = '🎙️';
        
        recognition.onend = () => {
            voiceBtn.textContent = '🎤';
        };
    } else {
        alert('Speech recognition not supported in this browser');
    }
});

// Execute Code
executeBtn.addEventListener('click', async () => {
    const code = codeInput.value.trim();
    const language = languageSelect.value;
    
    if (!code) return;
    
    executeOutput.textContent = 'Executing...';
    
    try {
        const response = await apiCall('/api/execute/code', 'POST', {
            code,
            language
        });
        
        if (response.success) {
            executeOutput.textContent = response.stdout || 'Executed successfully';
            if (response.stderr) {
                executeOutput.textContent += '\n\nWarnings:\n' + response.stderr;
            }
        } else {
            executeOutput.textContent = 'Error:\n' + response.error;
        }
    } catch (error) {
        executeOutput.textContent = 'Failed to execute: ' + error.message;
    }
});

// Files
async function loadFiles(path = '.') {
    try {
        const response = await apiCall(`/api/execute/file/list?dirpath=${encodeURIComponent(path)}`);
        
        fileList.innerHTML = '';
        
        if (response.success && response.files) {
            response.files.forEach(file => {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.textContent = file;
                item.addEventListener('click', () => {
                    // Could implement file reading here
                    console.log('Clicked:', file);
                });
                fileList.appendChild(item);
            });
        }
    } catch (error) {
        fileList.innerHTML = '<p>Failed to load files</p>';
    }
}

refreshFiles.addEventListener('click', () => loadFiles());

// Terminal
function addTerminalLine(text) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

terminalInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const command = terminalInput.value.trim();
        if (!command) return;
        
        addTerminalLine(`$ ${command}`);
        terminalInput.value = '';
        
        try {
            const response = await apiCall('/api/execute/command', 'POST', { command });
            
            if (response.success) {
                addTerminalLine(response.stdout || '');
                if (response.stderr) {
                    addTerminalLine(response.stderr);
                }
            } else {
                addTerminalLine(`Error: ${response.error}`);
            }
        } catch (error) {
            addTerminalLine(`Failed: ${error.message}`);
        }
    }
});

// Initialize
console.log('JARVIS Remote Control loaded');
