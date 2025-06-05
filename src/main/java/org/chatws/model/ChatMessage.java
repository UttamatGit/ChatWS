package org.chatws.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Model class for chat messages with support for:
 * - User identification
 * - Timestamps
 * - Message types (public, private)
 * - Message content
 * - Message editing and deletion
 * - Typing indicators
 * - Persistence in MongoDB
 */
@Document(collection = "messages")
public class ChatMessage {

    public enum MessageType {
        CHAT,       // Regular chat message
        JOIN,       // User joined notification
        LEAVE,      // User left notification
        PRIVATE,    // Private message
        USERS,      // Active users list update
        TYPING,     // User is typing
        EDIT,       // Edit a message
        DELETE      // Delete a message
    }

    @Id
    private String id;         // Unique message ID
    private MessageType type;
    private String content;
    private String sender;
    private String recipient;  // For private messages
    private String room;       // Chat room identifier
    private LocalDateTime timestamp;

    // Default constructor for JSON deserialization
    public ChatMessage() {
        this.id = UUID.randomUUID().toString();
        this.timestamp = LocalDateTime.now();
    }

    public ChatMessage(MessageType type, String content, String sender) {
        this.id = UUID.randomUUID().toString();
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.timestamp = LocalDateTime.now();
    }

    public ChatMessage(MessageType type, String content, String sender, String room) {
        this(type, content, sender);
        this.room = room;
    }

    public ChatMessage(MessageType type, String content, String sender, String recipient, String room) {
        this(type, content, sender);
        this.recipient = recipient;
        this.room = room;
    }

    // Constructor with specific ID (for editing/deleting)
    public ChatMessage(String id, MessageType type, String content, String sender) {
        this.id = id;
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.timestamp = LocalDateTime.now();
    }

    public ChatMessage(String id, MessageType type, String content, String sender, String room) {
        this(id, type, content, sender);
        this.room = room;
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }
}
