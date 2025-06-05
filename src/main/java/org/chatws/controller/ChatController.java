package org.chatws.controller;

import org.chatws.model.ChatMessage;
import org.chatws.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Controller
public class ChatController {

    @Autowired
    private ChatService chatService;

    @GetMapping("/")
    public String getChatPage() {
        return "chat"; // This will resolve to chat.html in the templates directory
    }

    /**
     * REST endpoint to get message history for a specific room
     * @param room the room identifier
     * @param limit optional parameter to limit the number of messages returned
     * @return list of messages in the room
     */
    @GetMapping("/api/messages/{room}")
    @org.springframework.web.bind.annotation.ResponseBody
    public ResponseEntity<List<ChatMessage>> getMessagesByRoom(
            @PathVariable String room,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        List<ChatMessage> messages = chatService.getRecentMessagesByRoom(room, limit);
        return ResponseEntity.ok(messages);
    }
}
