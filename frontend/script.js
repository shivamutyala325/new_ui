/* --- STATE MANAGEMENT --- */
let chatHistory = []; 
let selectedText = "";
let selectedRange = null; 
let windowContexts = {}; 

/* --- SETUP ENTER KEY LISTENER --- */
function setupEnterKey(textareaId, sendCallback) {
    const textarea = document.getElementById(textareaId);
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            sendCallback(); 
        }
    });
}

setupEnterKey('main-input', handleMainSend);

/* --- THEME TOGGLE LOGIC --- */
function toggleTheme() {
    const body = document.body;
    const btnIcon = document.querySelector('#theme-toggle span');
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        btnIcon.textContent = 'light_mode'; 
    } else {
        btnIcon.textContent = 'dark_mode'; 
    }
}

/* --- SELECTION LOGIC --- */
document.addEventListener('mouseup', (event) => {
    const selection = window.getSelection();
    const menu = document.getElementById('selection-menu');

    if (selection.toString().trim() === "" || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
        menu.classList.add('hidden');
        return;
    }

    if (selection.anchorNode.parentElement.closest('.micro-window')) {
        menu.classList.add('hidden');
        return;
    }

    if (menu.contains(event.target)) return;

    selectedText = selection.toString();
    try { selectedRange = selection.getRangeAt(0); } catch(e){ return; }

    let topPos = event.pageY + 10;
    if (topPos + menu.offsetHeight > window.innerHeight) {
        topPos = event.pageY - menu.offsetHeight - 10;
    }
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${topPos}px`;
    menu.classList.remove('hidden');
});

document.addEventListener('mousedown', (e) => {
    const menu = document.getElementById('selection-menu');
    if (!menu.contains(e.target)) menu.classList.add('hidden');
});

/* --- MENU ACTIONS --- */
function continueInMain() {
    const mainInput = document.getElementById('main-input');
    mainInput.focus();
    mainInput.value = `Regarding "${selectedText}": `;
    document.getElementById('selection-menu').classList.add('hidden');
}

function openMicroWindow() {
    document.getElementById('selection-menu').classList.add('hidden');
    
    const span = document.createElement('span');
    span.className = 'highlight-link';
    span.textContent = selectedText;
    
    const windowId = 'mw-' + Date.now();
    span.onclick = () => toggleWindow(windowId);
    
    selectedRange.deleteContents();
    selectedRange.insertNode(span);

    windowContexts[windowId] = selectedText;

    createFloatingWindow(windowId, selectedText);
}

/* --- WINDOW CREATION --- */
function createFloatingWindow(id, title) {
    const floatingLayer = document.getElementById('floating-layer');
    const win = document.createElement('div');
    win.className = 'micro-window';
    win.id = id;
    win.style.left = `${300 + Math.random() * 50}px`;
    win.style.top = `${100 + Math.random() * 50}px`;

    win.innerHTML = `
        <div class="mw-header" onmousedown="startDrag(event, '${id}')">
            <span>Context: ${title.substring(0, 15)}...</span>
            <i class="material-icons" style="cursor:pointer; font-size:16px;" onclick="hideWindow('${id}')">close</i>
        </div>
        <div class="mw-body" id="${id}-body">
            <div class="message model-message">
                I am listening regarding: <b>"${title.substring(0, 50)}..."</b>
            </div>
        </div>
        <div class="mw-footer">
            <textarea id="${id}-input" rows="1" placeholder="Ask about this..."></textarea>
            <button onclick="handleMicroSend('${id}')">Send</button>
        </div>
    `;

    floatingLayer.appendChild(win);
    setupEnterKey(`${id}-input`, () => handleMicroSend(id));
}

function toggleWindow(id) {
    const win = document.getElementById(id);
    if (win) win.style.display = win.style.display === 'none' ? 'flex' : 'none';
}

function hideWindow(id) { document.getElementById(id).style.display = 'none'; }

/* --- DRAGGING LOGIC --- */
let isDragging = false;
let currentDragWin = null;
let offset = { x: 0, y: 0 };

function startDrag(e, id) {
    isDragging = true;
    currentDragWin = document.getElementById(id);
    offset.x = e.clientX - currentDragWin.offsetLeft;
    offset.y = e.clientY - currentDragWin.offsetTop;
}

document.addEventListener('mousemove', (e) => {
    if (isDragging && currentDragWin) {
        currentDragWin.style.left = `${e.clientX - offset.x}px`;
        currentDragWin.style.top = `${e.clientY - offset.y}px`;
    }
});
document.addEventListener('mouseup', () => { isDragging = false; currentDragWin = null; });

/* --- CHAT LOGIC --- */

async function handleMainSend() {
    const input = document.getElementById('main-input');
    const text = input.value.trim();
    if (!text) return;

    addMessageToUI('main-chat-box', text, 'user-message');
    input.value = '';
    
    await sendToBackend(text, 'main-chat-box');
}

async function handleMicroSend(windowId) {
    const input = document.getElementById(`${windowId}-input`);
    const userQuery = input.value.trim();
    if (!userQuery) return;

    addMessageToUI(`${windowId}-body`, userQuery, 'user-message');
    input.value = '';

    const context = windowContexts[windowId] || "";
    const backendPrompt = `CONTEXT: "${context}"\n\nUSER QUESTION: ${userQuery}`;

    await sendToBackend(backendPrompt, `${windowId}-body`);
}

async function sendToBackend(messageToSend, targetContainerId) {
    const loadingId = addMessageToUI(targetContainerId, 'Thinking...', 'model-message');

    try {
        const response = await fetch('http://127.0.0.1:8000/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                history: chatHistory,
                message: messageToSend 
            })
        });

        const data = await response.json();
        
        chatHistory.push({ role: "user", content: messageToSend });
        chatHistory.push({ role: "model", content: data.response });

        const msgDiv = document.getElementById(loadingId);
        msgDiv.innerHTML = marked.parse(data.response); 

    } catch (err) {
        console.error(err);
        document.getElementById(loadingId).textContent = "Error connecting.";
    }
}

function addMessageToUI(containerId, text, className) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = `message ${className}`;
    
    if (text === 'Thinking...') {
        div.textContent = text;
    } else {
        div.innerHTML = marked.parse(text); 
    }

    div.id = 'msg-' + Date.now() + Math.random();
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id;
}