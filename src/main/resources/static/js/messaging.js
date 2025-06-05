// Message handling functions

// Handle received message based on type
function handleReceivedMessage(message) {
    switch (message.type) {
        case 'CHAT':
            addChatMessage(message);
            // Notify if not from current user and not from System
            if (message.sender !== username && message.sender !== 'System' && Notification.permission === 'granted' && !document.hasFocus()) {
                const notification = new Notification('New Message', {
                    body: `${message.sender}: ${message.content}`,
                    icon: '/favicon.ico'
                });

                // Show toast notification
                showToast(`New message from ${message.sender}`, 'info');

                // Play notification sound
                playNotificationSound();
            }
            break;
        case 'PRIVATE':
            addPrivateMessage(message);
            // Notify if not from current user
            if (message.sender !== username && Notification.permission === 'granted') {
                const notification = new Notification('New Private Message', {
                    body: `${message.sender}: ${message.content}`,
                    icon: '/favicon.ico'
                });

                // Show toast notification
                showToast(`New private message from ${message.sender}`, 'info');

                // Play notification sound
                playNotificationSound();
            }
            break;
        case 'USERS':
            updateActiveUsers(message.content.split(','));
            break;
        case 'TYPING':
            updateTypingIndicator(message.content.split(','));
            break;
        case 'EDIT':
            updateEditedMessage(message);
            break;
        case 'DELETE':
            deleteMessage(message);
            break;
        default:
            console.log('Unknown message type:', message.type);
    }
}

// Add a chat message to the display
function addChatMessage(message) {
    const li = document.createElement('li');
    li.className = message.sender === 'System' ? 
        'p-3 bg-white rounded-lg shadow-sm system-message message-appear' : 
        'p-3 bg-white rounded-lg shadow-sm message-appear';

    // Store message ID as data attribute
    li.dataset.messageId = message.id;

    // Create message container with avatar and content
    const messageContainer = document.createElement('div');
    messageContainer.className = 'flex';

    // Create avatar
    if (message.sender !== 'System') {
        const avatar = document.createElement('div');
        avatar.className = 'flex-shrink-0 mr-3';

        const avatarInner = document.createElement('div');
        avatarInner.className = 'w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium';
        avatarInner.textContent = message.sender.charAt(0).toUpperCase();

        avatar.appendChild(avatarInner);
        messageContainer.appendChild(avatar);
    }

    // Create message content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'flex-1';

    // Create message header with sender
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';

    const senderName = document.createElement('span');
    senderName.className = message.sender === 'System' ? 'font-bold text-green-600' : 'font-bold text-gray-800';
    senderName.textContent = message.sender;

    header.appendChild(senderName);

    // Add edit/delete buttons if message is from current user
    if (message.sender === username) {
        const actionButtons = document.createElement('div');
        actionButtons.className = 'flex space-x-2';

        // Edit button
        const editButton = document.createElement('button');
        editButton.className = 'text-gray-500 hover:text-primary-600 transition-colors duration-200 text-xs';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.title = 'Edit message';
        editButton.addEventListener('click', function() {
            startEditingMessage(message.id, content.textContent);
        });

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'text-gray-500 hover:text-red-600 transition-colors duration-200 text-xs';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.title = 'Delete message';
        deleteButton.addEventListener('click', function() {
            confirmDeleteMessage(message.id);
        });

        actionButtons.appendChild(editButton);
        actionButtons.appendChild(deleteButton);
        header.appendChild(actionButtons);
    }

    // Create message content
    const content = document.createElement('div');
    content.className = 'text-gray-700';
    content.textContent = message.content;

    // Create timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = formatTimestamp(message.timestamp);

    // Add all elements to the content container
    contentContainer.appendChild(header);
    contentContainer.appendChild(content);
    contentContainer.appendChild(timestamp);

    // Add content container to message container
    messageContainer.appendChild(contentContainer);

    // Add message container to list item
    li.appendChild(messageContainer);
    messagesList.appendChild(li);

    // Scroll to the bottom of the chat
    scrollToBottom();
}

// Add a private message to the display
function addPrivateMessage(message) {
    const li = document.createElement('li');
    li.className = 'p-3 bg-white rounded-lg shadow-sm private-message message-appear';

    // Store message ID as data attribute
    li.dataset.messageId = message.id;

    // Create message container with avatar and content
    const messageContainer = document.createElement('div');
    messageContainer.className = 'flex';

    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = 'flex-shrink-0 mr-3';

    const avatarInner = document.createElement('div');
    avatarInner.className = 'w-8 h-8 rounded-full bg-secondary-500 flex items-center justify-center text-white font-medium';

    if (message.sender === username) {
        avatarInner.textContent = username.charAt(0).toUpperCase();
    } else {
        avatarInner.textContent = message.sender.charAt(0).toUpperCase();
    }

    avatar.appendChild(avatarInner);
    messageContainer.appendChild(avatar);

    // Create message content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'flex-1';

    // Create message header with sender and recipient
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';

    const headerText = document.createElement('span');
    headerText.className = 'font-bold text-secondary-700';

    if (message.sender === username) {
        headerText.textContent = `You → ${message.recipient} (Private)`;
    } else {
        headerText.textContent = `${message.sender} → You (Private)`;
    }

    header.appendChild(headerText);

    // Add edit/delete buttons if message is from current user
    if (message.sender === username) {
        const actionButtons = document.createElement('div');
        actionButtons.className = 'flex space-x-2';

        // Edit button
        const editButton = document.createElement('button');
        editButton.className = 'text-gray-500 hover:text-primary-600 transition-colors duration-200 text-xs';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.title = 'Edit message';
        editButton.addEventListener('click', function() {
            startEditingMessage(message.id, content.textContent);
        });

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'text-gray-500 hover:text-red-600 transition-colors duration-200 text-xs';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.title = 'Delete message';
        deleteButton.addEventListener('click', function() {
            confirmDeleteMessage(message.id);
        });

        actionButtons.appendChild(editButton);
        actionButtons.appendChild(deleteButton);
        header.appendChild(actionButtons);
    }

    // Create message content
    const content = document.createElement('div');
    content.className = 'text-gray-700';
    content.textContent = message.content;

    // Create timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = formatTimestamp(message.timestamp);

    // Add all elements to the content container
    contentContainer.appendChild(header);
    contentContainer.appendChild(content);
    contentContainer.appendChild(timestamp);

    // Add content container to message container
    messageContainer.appendChild(contentContainer);

    // Add message container to list item
    li.appendChild(messageContainer);
    messagesList.appendChild(li);

    // Scroll to the bottom of the chat
    scrollToBottom();
}

// Send a message
function sendMessage() {
    const content = messageInput.value.trim();
    const type = messageType.value;

    if (!content || !socket || socket.readyState !== WebSocket.OPEN) {
        return;
    }

    // If we're editing a message, send an EDIT message instead
    if (isEditing && editingMessageId) {
        sendEditMessage(editingMessageId, content);
        cancelEditing();
        return;
    }

    let message = {
        type: type,
        content: content,
        sender: username,
        room: room
    };

    if (type === 'PRIVATE') {
        const recipient = privateRecipient.value;
        if (!recipient) {
            // Show error toast
            showToast('Please select a recipient for your private message', 'error');
            return;
        }
        message.recipient = recipient;
    }

    socket.send(JSON.stringify(message));
    messageInput.value = '';
    messageInput.focus();

    // Send typing stopped notification
    sendTypingStatus(false);
}

// Send typing status
function sendTypingStatus(isTyping) {
    if (!socket || socket.readyState !== WebSocket.OPEN || !username) {
        return;
    }

    // Clear existing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    // Send typing status
    const typingMessage = {
        type: 'TYPING',
        content: isTyping.toString(),
        sender: username
    };

    socket.send(JSON.stringify(typingMessage));

    // If typing, set timeout to automatically send stopped typing after 2 seconds
    if (isTyping) {
        typingTimeout = setTimeout(() => {
            sendTypingStatus(false);
        }, 2000);
    }
}

// Send edit message
function sendEditMessage(messageId, content) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
    }

    const editMessage = {
        id: messageId,
        type: 'EDIT',
        content: content,
        sender: username,
        room: room
    };

    socket.send(JSON.stringify(editMessage));
}

// Send delete message
function sendDeleteMessage(messageId) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
    }

    const deleteMessage = {
        id: messageId,
        type: 'DELETE',
        content: '',
        sender: username,
        room: room
    };

    socket.send(JSON.stringify(deleteMessage));
}