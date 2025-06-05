package org.chatws.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.chatws.model.ChatMessage;
import org.chatws.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ChatService chatService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        System.out.println("New connection established: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("Received message: " + payload);

        ChatMessage chatMessage = objectMapper.readValue(payload, ChatMessage.class);
        String username = chatService.getUsernameBySession(session);

        // Skip processing if no username is associated with this session
        if (username == null && chatMessage.getType() != ChatMessage.MessageType.JOIN) {
            return;
        }

        // Handle different message types
        switch (chatMessage.getType()) {
            case JOIN:
                handleJoinMessage(session, chatMessage);
                break;
            case CHAT:
                // Apply rate limiting for chat messages
                if (chatService.shouldRateLimit(username)) {
                    sendRateLimitWarning(session, username);
                    return;
                }
                chatService.updateLastMessageTime(username);
                handleChatMessage(chatMessage);
                break;
            case PRIVATE:
                // Apply rate limiting for private messages
                if (chatService.shouldRateLimit(username)) {
                    sendRateLimitWarning(session, username);
                    return;
                }
                chatService.updateLastMessageTime(username);
                handlePrivateMessage(chatMessage);
                break;
            case LEAVE:
                handleLeaveMessage(session);
                break;
            case TYPING:
                handleTypingMessage(chatMessage);
                break;
            case EDIT:
                handleEditMessage(chatMessage);
                break;
            case DELETE:
                handleDeleteMessage(chatMessage);
                break;
            default:
                break;
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String username = chatService.getUsernameBySession(session);
        if (username != null) {
            // Remove from typing users if they were typing
            chatService.removeTypingUser(username);
            // Broadcast typing status update
            broadcastTypingUsers();
        }

        handleLeaveMessage(session);
        sessions.remove(session);
        System.out.println("Connection closed: " + session.getId());
    }

    private void handleJoinMessage(WebSocketSession session, ChatMessage message) throws IOException {
        // Register the user
        String username = message.getSender();
        String room = message.getRoom();

        // Check if username is already taken
        if (chatService.isUsernameTaken(username)) {
            // Send error message back to the client
            ChatMessage errorMessage = new ChatMessage(
                ChatMessage.MessageType.CHAT, 
                "Username is already taken. Please choose another one.", 
                "System"
            );
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errorMessage)));
            return;
        }

        chatService.registerUser(session, username);

        // Send welcome message
        ChatMessage welcomeMessage = new ChatMessage(
            ChatMessage.MessageType.CHAT, 
            username + " has joined the chat!", 
            "System",
            room
        );
        broadcastMessage(welcomeMessage);

        // Send in-memory message history to the new user
        for (ChatMessage historyMessage : chatService.getMessageHistory()) {
            if (historyMessage.getType() == ChatMessage.MessageType.CHAT) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(historyMessage)));
            } else if (historyMessage.getType() == ChatMessage.MessageType.PRIVATE && 
                      (historyMessage.getSender().equals(username) || 
                       historyMessage.getRecipient().equals(username))) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(historyMessage)));
            }
        }

        // Send room-specific message history from database if room is specified
        if (room != null && !room.isEmpty()) {
            List<ChatMessage> roomHistory = chatService.getRecentMessagesByRoom(room, 50);
            for (ChatMessage historyMessage : roomHistory) {
                if (historyMessage.getType() == ChatMessage.MessageType.CHAT) {
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(historyMessage)));
                } else if (historyMessage.getType() == ChatMessage.MessageType.PRIVATE && 
                          (historyMessage.getSender().equals(username) || 
                           historyMessage.getRecipient().equals(username))) {
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(historyMessage)));
                }
            }
        }

        // Send active users list to all clients
        sendActiveUsers();
    }

    private void handleChatMessage(ChatMessage message) throws IOException {
        // Ensure message has a timestamp
        if (message.getTimestamp() == null) {
            message.setTimestamp(java.time.LocalDateTime.now());
        }

        // Add message to history
        chatService.addMessageToHistory(message);

        // Broadcast to all users
        broadcastMessage(message);
    }

    private void handlePrivateMessage(ChatMessage message) throws IOException {
        // Ensure message has a timestamp
        if (message.getTimestamp() == null) {
            message.setTimestamp(java.time.LocalDateTime.now());
        }

        // Add message to history
        chatService.addMessageToHistory(message);

        // Send to recipient
        WebSocketSession recipientSession = chatService.getSessionByUsername(message.getRecipient());
        if (recipientSession != null && recipientSession.isOpen()) {
            recipientSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
        }

        // Send back to sender
        WebSocketSession senderSession = chatService.getSessionByUsername(message.getSender());
        if (senderSession != null && senderSession.isOpen()) {
            senderSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
        }
    }

    private void handleLeaveMessage(WebSocketSession session) throws IOException {
        String username = chatService.getUsernameBySession(session);
        if (username != null) {
            // Remove from typing users if they were typing
            chatService.removeTypingUser(username);

            chatService.removeUser(session);

            // Notify other users
            ChatMessage leaveMessage = new ChatMessage(
                ChatMessage.MessageType.CHAT, 
                username + " has left the chat.", 
                "System"
            );
            broadcastMessage(leaveMessage);

            // Update active users list
            sendActiveUsers();

            // Update typing users
            broadcastTypingUsers();
        }
    }

    private void sendActiveUsers() throws IOException {
        List<String> activeUsers = chatService.getActiveUsers();
        ChatMessage usersMessage = new ChatMessage(
            ChatMessage.MessageType.USERS, 
            String.join(",", activeUsers), 
            "System"
        );
        broadcastMessage(usersMessage);
    }

    private void broadcastMessage(ChatMessage message) throws IOException {
        String json = objectMapper.writeValueAsString(message);
        TextMessage textMessage = new TextMessage(json);

        for (WebSocketSession session : sessions) {
            try {
                if (session.isOpen()) {
                    session.sendMessage(textMessage);
                }
            } catch (IOException | IllegalStateException e) {
                System.err.println("Error sending message: " + e.getMessage());
            }
        }
    }

    private void broadcastMessage(String message) {
        TextMessage textMessage = new TextMessage(message);
        for (WebSocketSession session : sessions) {
            try {
                if (session.isOpen()) {
                    session.sendMessage(textMessage);
                }
            } catch (IOException | IllegalStateException e) {
                System.err.println("Error sending message: " + e.getMessage());
            }
        }
    }

    /**
     * Handle typing indicator messages
     */
    private void handleTypingMessage(ChatMessage message) throws IOException {
        String username = message.getSender();
        boolean isTyping = Boolean.parseBoolean(message.getContent());

        if (isTyping) {
            chatService.addTypingUser(username);
        } else {
            chatService.removeTypingUser(username);
        }

        // Broadcast typing users to all clients
        broadcastTypingUsers();
    }

    /**
     * Broadcast the list of currently typing users
     */
    private void broadcastTypingUsers() throws IOException {
        Set<String> typingUsers = chatService.getTypingUsers();
        if (typingUsers.isEmpty()) {
            return;
        }

        // Convert Set to List for String.join
        String typingUsersStr = String.join(",", typingUsers);
        ChatMessage typingMessage = new ChatMessage(
            ChatMessage.MessageType.TYPING,
            typingUsersStr,
            "System"
        );

        broadcastMessage(typingMessage);
    }

    /**
     * Handle edit message requests
     */
    private void handleEditMessage(ChatMessage message) throws IOException {
        // Verify the sender is the original message author
        String username = message.getSender();
        String messageId = message.getId();

        // Find the message in history and update it
        boolean updated = false;
        for (ChatMessage historyMessage : chatService.getMessageHistory()) {
            if (historyMessage.getId().equals(messageId) && historyMessage.getSender().equals(username)) {
                historyMessage.setContent(message.getContent());
                updated = true;
                break;
            }
        }

        if (updated) {
            // Broadcast the edit to all users
            broadcastMessage(message);
        }
    }

    /**
     * Handle delete message requests
     */
    private void handleDeleteMessage(ChatMessage message) throws IOException {
        // Verify the sender is the original message author
        String username = message.getSender();
        String messageId = message.getId();

        // Find the message in history and mark it as deleted
        boolean deleted = false;
        for (ChatMessage historyMessage : chatService.getMessageHistory()) {
            if (historyMessage.getId().equals(messageId) && historyMessage.getSender().equals(username)) {
                // We don't actually remove it from history, just mark it as deleted by broadcasting
                deleted = true;
                break;
            }
        }

        if (deleted) {
            // Broadcast the deletion to all users
            broadcastMessage(message);
        }
    }

    /**
     * Send a rate limit warning to a user
     */
    private void sendRateLimitWarning(WebSocketSession session, String username) throws IOException {
        long cooldownMs = chatService.getRemainingCooldownMs(username);

        ChatMessage warningMessage = new ChatMessage(
            ChatMessage.MessageType.CHAT,
            "Please slow down. You can send another message in " + cooldownMs + "ms.",
            "System"
        );

        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(warningMessage)));
    }
}
