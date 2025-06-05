package org.chatws.service;

import org.chatws.model.ChatMessage;
import org.chatws.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service for managing chat-related functionality:
 * - Storing message history
 * - Tracking active users
 * - Managing user sessions
 * - Rate limiting messages
 * - Tracking typing users
 */
@Service
public class ChatService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    // Store message history (limited to last 100 messages)
    private final List<ChatMessage> messageHistory = new ArrayList<>();
    private static final int MAX_HISTORY_SIZE = 100;

    // Map to store user sessions with their usernames
    private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();
    private final Map<String, WebSocketSession> userSessionMap = new ConcurrentHashMap<>();

    // Rate limiting
    private final Map<String, LocalDateTime> lastMessageTimeMap = new ConcurrentHashMap<>();
    private static final Duration MESSAGE_RATE_LIMIT = Duration.ofMillis(500); // 500ms between messages

    // Typing indicators
    private final Set<String> typingUsers = new HashSet<>();

    /**
     * Add a message to the history and save to database
     */
    public synchronized void addMessageToHistory(ChatMessage message) {
        // Only store chat and private messages
        if (message.getType() == ChatMessage.MessageType.CHAT || 
            message.getType() == ChatMessage.MessageType.PRIVATE) {
            messageHistory.add(message);

            // Trim history if it exceeds the maximum size
            if (messageHistory.size() > MAX_HISTORY_SIZE) {
                messageHistory.remove(0);
            }

            // Save to database if it has a room
            if (message.getRoom() != null) {
                chatMessageRepository.save(message);
            }
        }
    }

    /**
     * Get the in-memory message history
     */
    public List<ChatMessage> getMessageHistory() {
        return new ArrayList<>(messageHistory);
    }

    /**
     * Get message history for a specific room from database
     * @param room the room identifier
     * @return list of messages in the room ordered by timestamp
     */
    public List<ChatMessage> getMessageHistoryByRoom(String room) {
        return chatMessageRepository.findByRoomOrderByTimestampDesc(room);
    }

    /**
     * Get the most recent messages for a room (limited by count)
     * @param room the room identifier
     * @param count maximum number of messages to return
     * @return list of recent messages in the room
     */
    public List<ChatMessage> getRecentMessagesByRoom(String room, int count) {
        List<ChatMessage> messages = chatMessageRepository.findByRoomOrderByTimestampDesc(room);
        return messages.size() <= count ? messages : messages.subList(0, count);
    }

    /**
     * Register a user session
     */
    public void registerUser(WebSocketSession session, String username) {
        String sessionId = session.getId();
        sessionUserMap.put(sessionId, username);
        userSessionMap.put(username, session);
    }

    /**
     * Remove a user session
     */
    public void removeUser(WebSocketSession session) {
        String sessionId = session.getId();
        String username = sessionUserMap.get(sessionId);

        if (username != null) {
            userSessionMap.remove(username);
        }

        sessionUserMap.remove(sessionId);
    }

    /**
     * Get username for a session
     */
    public String getUsernameBySession(WebSocketSession session) {
        return sessionUserMap.get(session.getId());
    }

    /**
     * Get session for a username
     */
    public WebSocketSession getSessionByUsername(String username) {
        return userSessionMap.get(username);
    }

    /**
     * Get all active usernames
     */
    public List<String> getActiveUsers() {
        return new ArrayList<>(userSessionMap.keySet());
    }

    /**
     * Check if a username is already taken
     */
    public boolean isUsernameTaken(String username) {
        return userSessionMap.containsKey(username);
    }

    /**
     * Check if a user is sending messages too frequently
     * @return true if the user should be rate limited
     */
    public boolean shouldRateLimit(String username) {
        LocalDateTime lastMessageTime = lastMessageTimeMap.get(username);
        if (lastMessageTime == null) {
            return false;
        }

        Duration timeSinceLastMessage = Duration.between(lastMessageTime, LocalDateTime.now());
        return timeSinceLastMessage.compareTo(MESSAGE_RATE_LIMIT) < 0;
    }

    /**
     * Update the last message time for a user
     */
    public void updateLastMessageTime(String username) {
        lastMessageTimeMap.put(username, LocalDateTime.now());
    }

    /**
     * Get the remaining cooldown time in milliseconds
     */
    public long getRemainingCooldownMs(String username) {
        LocalDateTime lastMessageTime = lastMessageTimeMap.get(username);
        if (lastMessageTime == null) {
            return 0;
        }

        Duration timeSinceLastMessage = Duration.between(lastMessageTime, LocalDateTime.now());
        long remainingMs = MESSAGE_RATE_LIMIT.toMillis() - timeSinceLastMessage.toMillis();
        return Math.max(0, remainingMs);
    }

    /**
     * Add a user to the typing users set
     */
    public void addTypingUser(String username) {
        typingUsers.add(username);
    }

    /**
     * Remove a user from the typing users set
     */
    public void removeTypingUser(String username) {
        typingUsers.remove(username);
    }

    /**
     * Get all currently typing users
     */
    public Set<String> getTypingUsers() {
        return new HashSet<>(typingUsers);
    }
}
