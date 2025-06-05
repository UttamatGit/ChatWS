// WebSocket connection and core functionality
let socket;
let username = '';
let room = '';
let activeUsers = [];
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let typingTimeout;
let isEditing = false;
let editingMessageId = null;

// DOM Elements references
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginErrorMessage = document.getElementById('loginErrorMessage');
const chatInterface = document.getElementById('chatInterface');
const usernameInput = document.getElementById('usernameInput');
const roomInput = document.getElementById('roomInput');
const joinButton = document.getElementById('joinButton');
const messagesList = document.getElementById('messagesList');
const loadingMessages = document.getElementById('loadingMessages');
const activeUsersList = document.getElementById('activeUsersList');
const userCount = document.getElementById('userCount');
const userSearch = document.getElementById('userSearch');
const messageInput = document.getElementById('messageInput');
const messageType = document.getElementById('messageType');
const privateRecipient = document.getElementById('privateRecipient');
const sendButton = document.getElementById('sendButton');
const emojiButton = document.getElementById('emojiButton');
const emojiPicker = document.getElementById('emojiPicker');
const connectionStatus = document.getElementById('connectionStatus');
const connectionIndicator = document.getElementById('connectionIndicator');
const connectionText = document.getElementById('connectionText');
const roomDisplay = document.getElementById('roomDisplay');

// Connect to WebSocket server
function connect() {
    if (isConnecting) return;
    isConnecting = true;

    // Determine the WebSocket URL based on the current page URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/chat`;

    updateConnectionStatus('Connecting...', 'bg-yellow-400');

    socket = new WebSocket(wsUrl);

    // Connection opened
    socket.onopen = function(event) {
        console.log('WebSocket connection established');
        updateConnectionStatus('Connected', 'bg-green-500');
        isConnecting = false;
        reconnectAttempts = 0;

        // Show chat interface
        loginForm.classList.add('hidden');
        chatInterface.classList.remove('hidden');

        // Send JOIN message
        sendJoinMessage();

        // Show messages list and hide loading indicator
        setTimeout(() => {
            loadingMessages.classList.add('hidden');
            messagesList.classList.remove('hidden');
        }, 500);
    };

    // Listen for messages
    socket.onmessage = function(event) {
        const messageData = JSON.parse(event.data);
        handleReceivedMessage(messageData);
    };

    // Connection closed
    socket.onclose = function(event) {
        console.log('WebSocket connection closed');
        updateConnectionStatus('Disconnected', 'bg-gray-400');
        isConnecting = false;

        // Try to reconnect after a delay if we're already in the chat
        if (username && !chatInterface.classList.contains('hidden') && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            updateConnectionStatus(`Reconnecting (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`, 'bg-yellow-400');
            reconnectAttempts++;

            setTimeout(function() {
                connect();
            }, 3000);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            updateConnectionStatus('Connection failed', 'bg-red-500');

            // Show reconnect button
            const reconnectButton = document.createElement('button');
            reconnectButton.className = 'ml-2 text-xs bg-primary-500 hover:bg-primary-600 text-white px-2 py-1 rounded';
            reconnectButton.textContent = 'Reconnect';
            reconnectButton.addEventListener('click', function() {
                reconnectAttempts = 0;
                connect();
                this.remove();
            });

            connectionStatus.appendChild(reconnectButton);
        }
    };

    // Connection error
    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
        updateConnectionStatus('Connection error', 'bg-red-500');
        isConnecting = false;

        // If we're still in the login screen, show error
        if (!chatInterface.classList.contains('hidden')) {
            showLoginError('Could not connect to chat server');
            joinButton.disabled = false;
            joinButton.innerHTML = '<span>Join Chat</span><i class="fas fa-arrow-right ml-2"></i>';
        }
    };
}

// Send JOIN message
function sendJoinMessage() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const joinMessage = {
            type: 'JOIN',
            sender: username,
            content: 'joined the chat',
            room: room
        };
        socket.send(JSON.stringify(joinMessage));

        // If room is specified, load message history from server and display room name
        if (room) {
            loadMessageHistory(room);
            roomDisplay.textContent = room;
            roomDisplay.classList.remove('hidden');
        }
    }
}

// Load message history from server
function loadMessageHistory(roomName) {
    fetch(`/api/messages/${roomName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load message history');
            }
            return response.json();
        })
        .then(messages => {
            // Display messages in reverse order (oldest first)
            messages.reverse().forEach(message => {
                if (message.type === 'CHAT') {
                    addChatMessage(message);
                } else if (message.type === 'PRIVATE' && 
                          (message.sender === username || message.recipient === username)) {
                    addPrivateMessage(message);
                }
            });
        })
        .catch(error => {
            console.error('Error loading message history:', error);
            showToast('Failed to load message history', 'error');
        });
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    requestNotificationPermission();

    // Create typing indicator element
    const typingIndicatorContainer = document.createElement('div');
    typingIndicatorContainer.id = 'typingIndicator';
    typingIndicatorContainer.className = 'p-2 text-sm text-gray-500 hidden';
    messagesList.parentNode.insertBefore(typingIndicatorContainer, messagesList.nextSibling);

    // Create notification sound
    const audioElement = document.createElement('audio');
    audioElement.id = 'notificationSound';
    audioElement.src = 'https://cdn.jsdelivr.net/gh/ferdium/ferdium-app@develop/recipes/messenger/notification.mp3';
    audioElement.preload = 'auto';
    document.body.appendChild(audioElement);
    
    // Add keyframe animation for shake effect
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
    `;
    document.head.appendChild(style);
    
    // Set up event listeners
    setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
    // Show/hide private recipient dropdown based on message type
    messageType.addEventListener('change', function() {
        if (this.value === 'PRIVATE') {
            privateRecipient.classList.remove('hidden');
        } else {
            privateRecipient.classList.add('hidden');
        }
    });

    // Toggle emoji picker
    emojiButton.addEventListener('click', function() {
        emojiPicker.classList.toggle('hidden');
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', function(event) {
        if (!emojiButton.contains(event.target) && !emojiPicker.contains(event.target) && !emojiPicker.classList.contains('hidden')) {
            emojiPicker.classList.add('hidden');
        }
    });

    // Handle emoji selection
    document.querySelector('emoji-picker').addEventListener('emoji-click', event => {
        messageInput.value += event.detail.unicode;
        emojiPicker.classList.add('hidden');
        messageInput.focus();
    });

    // Filter users based on search input
    userSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const userItems = activeUsersList.querySelectorAll('li');

        userItems.forEach(item => {
            const username = item.textContent.toLowerCase();
            if (username.includes(searchTerm) || searchTerm === '') {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    });

    // Join chat button click
    joinButton.addEventListener('click', function() {
        const name = usernameInput.value.trim();
        if (!name) {
            showLoginError('Please enter a nickname');
            return;
        }

        if (name.length < 3) {
            showLoginError('Nickname must be at least 3 characters');
            return;
        }

        if (name.length > 20) {
            showLoginError('Nickname must be less than 20 characters');
            return;
        }

        // Get room name (optional)
        room = roomInput.value.trim();

        // Disable button and show loading state
        joinButton.disabled = true;
        joinButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Connecting...';

        username = name;
        hideLoginError();
        connect();
    });

    // Send message button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter key
    messageInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        } else {
            // Send typing status
            sendTypingStatus(true);
        }
    });

    // Also detect typing on input events (for paste, etc.)
    messageInput.addEventListener('input', function() {
        sendTypingStatus(true);
    });

    // Join on Enter key in username input
    usernameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            joinButton.click();
        }
    });

    // Clear error when typing in username input
    usernameInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            hideLoginError();
        }
    });
}