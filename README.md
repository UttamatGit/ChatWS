
# ChatWS - Real-time Chat Application

ChatWS is a professional real-time chat application built with Spring Boot and WebSocket technology. It provides a robust platform for instant messaging with features typically found in modern chat applications.

## Features

- **Real-time Communication**: Instant message delivery using WebSocket protocol
- **User Authentication**: Simple username-based authentication system
- **Chat Rooms**: Support for multiple chat rooms
- **Private Messaging**: Direct messaging between users
- **Message History**: Persistent storage of messages using MongoDB
- **Typing Indicators**: Real-time typing status notifications
- **User Presence**: Active users list with online status
- **Message Editing & Deletion**: Ability to edit or delete sent messages
- **Emoji Support**: Built-in emoji picker for expressive communication
- **Rate Limiting**: Protection against message flooding
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Technology Stack

- **Backend**:
  - Java 24
  - Spring Boot 3.5.0
  - Spring WebSocket
  - Spring Data MongoDB
  - Jackson for JSON processing

- **Frontend**:
  - HTML5, CSS3, JavaScript
  - Tailwind CSS for styling
  - Thymeleaf for server-side templating
  - Font Awesome for icons
  - Emoji Picker Element for emoji support

## Project Structure

The application follows a standard Spring Boot project structure:

- **Model**: Defines the `ChatMessage` class with various message types
- **Repository**: MongoDB data access layer for message persistence
- **Service**: Business logic for chat functionality
- **Controller**: Web endpoints and WebSocket handler
- **Configuration**: WebSocket and Jackson configuration
- **Resources**: Static assets and Thymeleaf templates

## Getting Started

### Prerequisites

- Java 24 or higher
- Maven
- MongoDB

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ChatWS.git
   cd ChatWS
   ```

2. Configure MongoDB connection in `application.properties` (if not using default settings)

3. Build the application:
   ```
   mvn clean install
   ```

4. Run the application:
   ```
   mvn spring-boot:run
   ```

5. Access the application in your browser:
   ```
   http://localhost:8080
   ```

## Usage

1. **Join Chat**: Enter your nickname and optionally a room name
2. **Send Messages**: Type in the message box and press Enter or click Send
3. **Private Messages**: Select "Private" from the dropdown and choose a recipient
4. **Emoji**: Click the emoji button to open the emoji picker
5. **View Active Users**: See all online users in the sidebar
6. **Search Users**: Filter the active users list using the search box

## Key Components

### ChatMessage Model

The `ChatMessage` class supports various message types:
- `CHAT`: Regular public messages
- `JOIN`: User joined notifications
- `LEAVE`: User left notifications
- `PRIVATE`: Direct messages between users
- `USERS`: Active users list updates
- `TYPING`: Typing status indicators
- `EDIT`: Message editing
- `DELETE`: Message deletion

### WebSocket Handler

The `ChatWebSocketHandler` manages all WebSocket connections and message routing, including:
- Connection management
- Message broadcasting
- Private message delivery
- Typing indicators
- Rate limiting

### Chat Service

The `ChatService` provides the business logic for:
- Message history management
- User session tracking
- Room-based messaging
- Rate limiting
- Typing status management

## Security Considerations

- The current implementation uses simple username authentication
- For production use, consider adding proper authentication and authorization
- The WebSocket endpoint allows all origins (`*`) for development; restrict this in production
- Implement HTTPS in production environments

## Future Enhancements

- User accounts and authentication
- Message encryption
- File sharing
- Voice and video chat
- Read receipts
- Message reactions

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Spring Boot team for the excellent framework
- Tailwind CSS for the responsive design utilities
- All open-source libraries used in this project
