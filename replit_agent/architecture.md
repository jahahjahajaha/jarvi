# Architecture Overview

## Overview

Jarvi is a Discord music bot built using Discord.js v14 and Node.js. The bot provides music playback functionality across Discord servers, supporting various music sources including YouTube, Spotify, and other platforms through the Lavalink audio player.

The bot follows a modular architecture with clear separation of concerns between commands, events, utilities, and core functionality. It utilizes a MongoDB database for persistent storage and integrates with external services like Lavalink for audio processing.

## System Architecture

### Core Components

1. **Discord.js Client**: The foundation of the bot, responsible for interacting with the Discord API.
2. **Lavalink Integration**: Handles audio streaming and processing through the Erela.js client.
3. **Command System**: Processes both traditional text commands and slash commands.
4. **Event System**: Responds to Discord events and Lavalink events.
5. **Database System**: Stores persistent data using MongoDB.
6. **Monitoring System**: Tracks bot health and performance metrics.

### Architectural Flow

```
User Interaction → Discord API → Discord.js Client → Command/Event Handlers → 
    ├─ Database Interaction (MongoDB)
    ├─ Music Processing (Lavalink via Erela.js)
    └─ Response to User
```

## Key Components

### Client Structure

- **MusicClient (MusicBot class)**: Extends Discord.js Client with custom functionality for music playback.
- **PlayerBase**: Extends Erela.js Player with custom track management capabilities.

### Command System

- **Text Commands**: Traditional prefix-based commands stored in `/src/commands/`.
- **Slash Commands**: Interaction-based commands stored in `/src/slashCommands/`.
- Both command types are organized by category (Music, Utility, Information).

### Event System

- **Discord Events**: Handled through files in `/src/events/Client/`.
- **Lavalink Events**: Handled through files in `/src/events/Lavalink/`.
- Event-driven architecture for handling all bot interactions.

### Database Integration

- **MongoDB**: Used for storing persistent data.
- **Schema Models**: Defined in `/src/schema/` for various data entities.
- **QuickMongo**: Provides a simplified interface for database operations.

### Utilities

- Various utility modules in `/src/utils/` for common functionalities:
  - Logging
  - Localization (i18n)
  - Music player enhancements
  - Status monitoring
  - Conversion helpers

## Data Flow

### Command Processing Flow

1. User sends a command message/interaction to Discord
2. Discord forwards the message to the bot
3. The message is processed by the event handler
4. Command handler identifies and executes the appropriate command
5. Command logic is executed, interacting with database or Lavalink as needed
6. Response is sent back to the user through Discord

### Music Playback Flow

1. User requests a song via play command
2. Bot searches for the song via Lavalink
3. Upon finding the song, it's added to the player queue
4. Lavalink streams the audio to Discord
5. Events from Lavalink (track start, end, etc.) trigger appropriate handlers
6. Bot responds with embed messages to inform users of playback status

## External Dependencies

### Core Dependencies

- **discord.js**: Main API library for Discord interaction
- **erela.js**: Client for Lavalink integration
- **mongoose**: MongoDB object modeling

### Music Services Integration

- **Lavalink**: External Java application for audio processing
- **Spotify API**: For Spotify track resolution
- **YouTube**: For YouTube track playback
- **Apple Music**: For Apple Music track resolution
- **Deezer**: For Deezer track resolution

### Other External Services

- **Top.gg API**: For bot voting integration
- **Express**: For potential web dashboard functionality

## Localization

The bot supports multiple languages using i18n:
- English (default)
- Hindi (partial implementation)

Language files are stored in `/src/locales/` as JSON files.

## Configuration

The bot uses a combination of:
- Environment variables (`.env` file)
- Configuration module (`src/config.js`)

Key configuration includes:
- Discord token and API endpoints
- Lavalink server settings
- MongoDB connection string
- Logging channel IDs
- Default prefix and bot status

## Deployment Strategy

The bot appears to be configured for deployment on Replit, with:
- Replit configuration files (`.replit`, `replit.nix`)
- Node.js v20 runtime
- Web server capability for keeping the bot alive

The deployment workflow includes:
1. Installing dependencies
2. Starting the bot with `node index.js`
3. Handling potential restarts via Replit's system

## Monitoring and Logging

- **SimpleStatusMonitor**: Provides basic status monitoring
- **Logger**: Custom logging utility that can log to both console and Discord channels
- **Error Handling**: Global error handlers for unhandled exceptions and rejections

## Security Considerations

- Sensitive configuration stored in environment variables
- Bot uses permission checks for commands
- Role-based checks for administrative commands

## Areas for Improvement

1. **Scalability**: The current architecture might need enhancements for scaling to many servers
2. **Testing**: No apparent test framework implementation
3. **Documentation**: Limited inline documentation for functions and methods
4. **Error Handling**: Could benefit from more robust error handling in some areas
5. **Configuration Management**: Consolidate the multiple configuration sources