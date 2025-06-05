// UI-related functions

// Show login error message
function showLoginError(message) {
    loginErrorMessage.textContent = message;
    loginError.classList.remove('hidden');
    usernameInput.classList.add('border-red-500');

    // Shake animation for error feedback
    loginForm.classList.add('animate-shake');
    setTimeout(() => {
        loginForm.classList.remove('animate-shake');
    }, 500);
}

// Hide login error message
function hideLoginError() {
    loginError.classList.add('hidden');
    usernameInput.classList.remove('border-red-500');
}

// Update connection status UI
function updateConnectionStatus(status, color) {
    connectionText.textContent = status;
    connectionIndicator.className = `w-2 h-2 rounded-full mr-2 ${color}`;
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white ${
        type === 'error' ? 'bg-red-500' : 
        type === 'success' ? 'bg-green-500' : 
        'bg-primary-500'
    } transition-opacity duration-300 flex items-center`;

    const icon = document.createElement('i');
    icon.className = `mr-2 ${
        type === 'error' ? 'fas fa-exclamation-circle' : 
        type === 'success' ? 'fas fa-check-circle' : 
        'fas fa-info-circle'
    }`;

    const text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    if (!timestamp) return '';

    // If timestamp is a string, parse it
    const date = typeof timestamp === 'string' ? 
        new Date(timestamp) : new Date();

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Scroll to the bottom of the chat
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Update typing indicator
function updateTypingIndicator(typingUsers) {
    const typingIndicator = document.getElementById('typingIndicator');

    // Filter out current user
    typingUsers = typingUsers.filter(user => user !== username && user.trim() !== '');

    if (typingUsers.length === 0) {
        typingIndicator.classList.add('hidden');
        return;
    }

    typingIndicator.classList.remove('hidden');

    let text = '';
    if (typingUsers.length === 1) {
        text = `${typingUsers[0]} is typing`;
    } else if (typingUsers.length === 2) {
        text = `${typingUsers[0]} and ${typingUsers[1]} are typing`;
    } else {
        text = `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;
    }

    typingIndicator.innerHTML = `
        ${text} <span class="typing-indicator"><span></span><span></span><span></span></span>
    `;
}

// Update the active users list
function updateActiveUsers(users) {
    activeUsers = users;
    activeUsersList.innerHTML = '';
    userCount.textContent = users.length;

    // Update the private recipient dropdown
    privateRecipient.innerHTML = '<option value="">Select recipient...</option>';

    users.forEach(user => {
        if (user !== username) {
            // Add to active users list
            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 rounded-lg mb-2 flex items-center user-appear hover:bg-gray-100 transition-colors duration-200';

            // Create avatar
            const avatar = document.createElement('div');
            avatar.className = 'w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium mr-3';
            avatar.textContent = user.charAt(0).toUpperCase();

            // Create username
            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'flex-1';
            usernameSpan.textContent = user;

            // Create private message button
            const messageButton = document.createElement('button');
            messageButton.className = 'text-gray-500 hover:text-primary-600 transition-colors duration-200';
            messageButton.innerHTML = '<i class="far fa-comment"></i>';
            messageButton.title = `Send private message to ${user}`;
            messageButton.addEventListener('click', function() {
                messageType.value = 'PRIVATE';
                privateRecipient.classList.remove('hidden');
                privateRecipient.value = user;
                messageInput.focus();
            });

            li.appendChild(avatar);
            li.appendChild(usernameSpan);
            li.appendChild(messageButton);
            activeUsersList.appendChild(li);

            // Add to private recipient dropdown
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            privateRecipient.appendChild(option);
        }
    });

    // Filter users if search is active
    if (userSearch.value.trim() !== '') {
        const searchEvent = new Event('input');
        userSearch.dispatchEvent(searchEvent);
    }
}

// Start editing a message
function startEditingMessage(messageId, content) {
    isEditing = true;
    editingMessageId = messageId;

    // Update UI to show editing state
    messageInput.value = content;
    messageInput.focus();

    // Change send button text
    sendButton.innerHTML = '<i class="fas fa-check"></i>';
    sendButton.title = 'Save changes';

    // Add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancelEditButton';
    cancelButton.className = 'bg-gray-300 hover:bg-gray-400 text-gray-700 p-2 rounded-lg transition duration-200 ml-1';
    cancelButton.innerHTML = '<i class="fas fa-times"></i>';
    cancelButton.title = 'Cancel editing';
    cancelButton.addEventListener('click', cancelEditing);

    sendButton.parentNode.appendChild(cancelButton);

    // Show editing indicator
    showToast('Editing message...', 'info');
}

// Cancel editing
function cancelEditing() {
    isEditing = false;
    editingMessageId = null;

    // Reset UI
    messageInput.value = '';

    // Reset send button
    sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
    sendButton.title = 'Send message';

    // Remove cancel button
    const cancelButton = document.getElementById('cancelEditButton');
    if (cancelButton) {
        cancelButton.remove();
    }
}

// Update edited message in UI
function updateEditedMessage(message) {
    const messageElement = document.querySelector(`li[data-message-id="${message.id}"]`);
    if (!messageElement) return;

    const contentElement = messageElement.querySelector('.text-gray-700');
    if (contentElement) {
        contentElement.textContent = message.content;

        // Add edited indicator if not already present
        if (!contentElement.querySelector('.edited-indicator')) {
            const editedIndicator = document.createElement('span');
            editedIndicator.className = 'edited-indicator text-xs text-gray-500 ml-1';
            editedIndicator.textContent = '(edited)';
            contentElement.appendChild(editedIndicator);
        }

        // Show toast if someone else edited their message
        if (message.sender !== username) {
            showToast(`${message.sender} edited a message`, 'info');
        }
    }
}

// Delete message from UI
function deleteMessage(message) {
    const messageElement = document.querySelector(`li[data-message-id="${message.id}"]`);
    if (!messageElement) return;

    // Replace content with "This message has been deleted"
    const contentElement = messageElement.querySelector('.text-gray-700');
    if (contentElement) {
        contentElement.textContent = 'This message has been deleted';
        contentElement.className = 'text-gray-400 italic';

        // Remove edit/delete buttons
        const actionButtons = messageElement.querySelector('.flex.space-x-2');
        if (actionButtons) {
            actionButtons.remove();
        }

        // Show toast if someone else deleted their message
        if (message.sender !== username) {
            showToast(`${message.sender} deleted a message`, 'info');
        }
    }
}

// Confirm delete message
function confirmDeleteMessage(messageId) {
    // Create confirmation dialog
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    confirmDialog.id = 'confirmDialog';

    confirmDialog.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm mx-auto">
            <h3 class="text-lg font-bold mb-4">Delete Message</h3>
            <p class="mb-6">Are you sure you want to delete this message? This cannot be undone.</p>
            <div class="flex justify-end space-x-2">
                <button id="cancelDelete" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                    Cancel
                </button>
                <button id="confirmDelete" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                    Delete
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmDialog);

    // Add event listeners
    document.getElementById('cancelDelete').addEventListener('click', function() {
        confirmDialog.remove();
    });

    document.getElementById('confirmDelete').addEventListener('click', function() {
        sendDeleteMessage(messageId);
        confirmDialog.remove();
    });
}

// Play notification sound
function playNotificationSound() {
    const sound = document.getElementById('notificationSound');
    if (sound) {
        sound.play().catch(e => console.log('Error playing sound:', e));
    }
}