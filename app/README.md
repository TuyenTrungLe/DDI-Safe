# Drug Interaction Agent API - Refactored Structure

This directory contains the refactored FastAPI application following best practices for project organization.

## 📁 Directory Structure

```
app/
├── __init__.py                 # Package initialization
├── main.py                     # FastAPI app initialization and configuration
├── README.md                   # This file
│
├── api/                        # API layer
│   ├── __init__.py
│   └── routes/                 # API route modules
│       ├── __init__.py
│       ├── health.py           # Health check and root endpoints
│       ├── stats.py            # Statistics endpoints
│       └── queries.py          # Query and chat endpoints
│
├── core/                       # Core business logic
│   ├── __init__.py
│   ├── config.py              # Configuration and settings
│   └── agent.py               # Agent management and initialization
│
└── models/                     # Pydantic models
    ├── __init__.py
    ├── requests.py            # Request models
    └── responses.py           # Response models
```

## 🚀 Running the Application

### Option 1: Using the main module (Recommended)

```bash
# From the project root directory
python -m app.main
```

### Option 2: Using uvicorn directly

```bash
# From the project root directory
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 3: Using the provided script

```bash
# From the project root directory
python app/main.py
```

## 🔧 Configuration

Configuration is managed through environment variables and the `.env` file. All settings are defined in `app/core/config.py`:

### Available Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `API_HOST` | `0.0.0.0` | API host address |
| `API_PORT` | `8000` | API port |
| `API_RELOAD` | `true` | Enable auto-reload in development |
| `GEMINI_API_KEY` | - | Gemini API key (required) |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Gemini model name |
| `DATA_FILE` | `TWOSIDES_preprocessed.csv` | Path to drug interaction data |
| `AGENT_VERBOSE` | `false` | Enable verbose agent logging |

### Example .env file

```bash
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-3.1-flash-lite
DATA_FILE=TWOSIDES_preprocessed.csv
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
AGENT_VERBOSE=false
```

## 📚 Module Overview

### `app/main.py`
- FastAPI application initialization
- Middleware configuration (CORS)
- Router registration
- Lifespan management (startup/shutdown)

### `app/core/config.py`
- Centralized configuration using Pydantic Settings
- Environment variable loading
- Settings validation

### `app/core/agent.py`
- `AgentManager` class for managing agent lifecycle
- Session management
- Agent initialization and cleanup

### `app/models/`
- **requests.py**: Pydantic models for API requests
  - `QueryRequest`
  - `ChatRequest`
- **responses.py**: Pydantic models for API responses
  - `QueryResponse`
  - `ChatResponse`
  - `StatsResponse`
  - `HealthResponse`
  - `ErrorResponse`

### `app/api/routes/`
- **health.py**: System health and root endpoints
  - `GET /` - API information
  - `GET /health` - Health check

- **stats.py**: Statistics endpoints
  - `GET /stats` - Get database and session statistics

- **queries.py**: Query and chat endpoints
  - `POST /query` - Simple query without session
  - `POST /chat` - Chat with session management
  - `DELETE /chat/{session_id}` - Clear session

## 🔄 Migration from Old Structure

The original `drug_agent_api.py` has been refactored into multiple modules:

| Old Location | New Location |
|--------------|--------------|
| Global variables | `app/core/agent.py` (`AgentManager` class) |
| Configuration | `app/core/config.py` (`Settings` class) |
| Pydantic models | `app/models/` |
| API endpoints | `app/api/routes/` |
| FastAPI app initialization | `app/main.py` |

### Key Changes

1. **Better separation of concerns**: Each module has a single responsibility
2. **Improved testability**: Components can be tested independently
3. **Configuration management**: Centralized settings with validation
4. **Session management**: Encapsulated in `AgentManager` class
5. **Modular routing**: Endpoints grouped by functionality

## 🧪 Testing

The refactored structure makes it easier to write tests:

```python
# Example: Testing the AgentManager
from app.core.agent import AgentManager

def test_agent_initialization():
    manager = AgentManager()
    manager.initialize_agent()
    assert manager.agent is not None
```

## 📖 API Documentation

Once the application is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🛠️ Development Tips

1. **Adding new endpoints**: Create a new file in `app/api/routes/` and register it in `app/main.py`
2. **Adding new models**: Add them to `app/models/` and export in `__init__.py`
3. **Configuration changes**: Update `app/core/config.py`
4. **Agent behavior**: Modify `app/core/agent.py`

## 🔍 Benefits of This Structure

1. **Scalability**: Easy to add new features without cluttering a single file
2. **Maintainability**: Clear separation makes code easier to understand and modify
3. **Testability**: Each component can be tested in isolation
4. **Team collaboration**: Multiple developers can work on different modules
5. **Best practices**: Follows FastAPI and Python project structure conventions
