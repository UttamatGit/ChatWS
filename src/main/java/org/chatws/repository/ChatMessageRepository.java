package org.chatws.repository;

import org.chatws.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for ChatMessage entity
 * Provides methods for saving and retrieving messages from MongoDB
 */
@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    
    /**
     * Find messages by room
     * @param room the room identifier
     * @return list of messages in the room
     */
    List<ChatMessage> findByRoom(String room);
    
    /**
     * Find messages by room ordered by timestamp (descending)
     * @param room the room identifier
     * @return list of messages in the room ordered by timestamp
     */
    List<ChatMessage> findByRoomOrderByTimestampDesc(String room);
    
    /**
     * Find messages by sender
     * @param sender the sender username
     * @return list of messages sent by the user
     */
    List<ChatMessage> findBySender(String sender);
}