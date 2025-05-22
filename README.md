# IaChatbotFrontend Backend

This is the backend service for the IaChatbotFrontend application. It is built using FastAPI and provides APIs for interacting with AI models, uploading files, and handling chat messages.

## Features

- **Chat API**: Send messages to an AI model and receive responses.
- **Model Management**: Fetch available AI models from the server.
- **File Upload**: Upload files to the server for use in chat interactions.

---

## Requirements

- Python 3.9 or higher
- FastAPI
- Uvicorn (for running the server)
- `requests` library (for making HTTP requests)
- `pydantic` library (for data validation)
- `shutil` and `os` (for file handling)

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/IaChatbotFrontend.git
   cd IaChatbotFrontend/backend


2. Create a virtual environment and activate it:
   ```bash
    python3 -m venv venv
    source venv/bin/activate

3. Install the required dependencies
   ```bash
    pip install -r requirements.txt

4. Ensure the uploads directory exists:
   ```bash
    mkdir uploads

Running the Server
Start the FastAPI server using Uvicorn:

    
    uvicorn ia:app --reload

The server will be available at http://127.0.0.1:8000.

API Endpoints
<vscode_annotation details='%5B%7B%22title%22%3A%22hardcoded-credentials%22%2C%22description%22%3A%22Embedding%20credentials%20in%20source%20code%20risks%20unauthorized%20access%22%7D%5D'>###</vscode_annotation> 1. Chat with AI

Endpoint: POST /ask
Description: Sends a chat message to the AI model and retrieves a response.
Request Body:

```
    {
    "messages": [
        { "role": "user", "content": "Hello!" }
    ],
    "model": "deepseek-r1"
    }