import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Badge,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import axios from "axios";
import logo from "/logo.png";
import CloseIcon from "@mui/icons-material/Close";

type Message = {
    role: "user" | "assistant";
    content: string;
    attachments?: string[];  // Array of filenames
  };

type OllamaModel = {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
};

type FileAttachment = {
  name: string;
  type: string;
  preview?: string;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("deepseek-r1");
  const [modelsLoading, setModelsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get("http://localhost:8000/models");
        setModels(response.data.models);
        const defaultModel =
          response.data.models.find((m: OllamaModel) =>
            m.name.includes("deepseek-r1")
          ) ||
          response.data.models[0]?.name ||
          "llama2";
        setSelectedModel(defaultModel.name || defaultModel);
      } catch (error) {
        setError("Failed to load available models. Using default.");
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        name: file.name,
        type: file.type,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined
      }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) {
      return [];
    }
  
    const formData = new FormData();
    
    // Add all selected files to FormData
    Array.from(fileInputRef.current.files).forEach((file) => {
      formData.append("files", file);  // Note the plural "files" matches backend
    });
  
    try {
      const response = await axios.post("http://localhost:8000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.filenames;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error; // Rethrow to handle in handleSubmit
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim() && !attachments.length) return;

  setLoading(true);
  setError(null);

  try {
    const uploadedFiles = await uploadFiles();
    
    const userMessage: Message = {
      role: "user",
      content: input,
      attachments: uploadedFiles
    };

    const response = await axios.post("http://localhost:8000/ask", {
      model: selectedModel,
      messages: [...messages, userMessage]
    });

    const assistantMessage: Message = {
      role: "assistant",
      content: response.data.response || "No response received"
    };
    
    setMessages(prev => [...prev, assistantMessage]);
  } catch (error) {
    console.error("Error:", error);
    setError(error.response?.data?.detail || "Failed to send message");
  } finally {
    setInput("");
    setAttachments([]);
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input
    }
  }
};

  const renderMessageContent = (msg: Message) => {
    return (
      <>
        {msg.content && <Typography>{msg.content}</Typography>}
        {msg.attachments?.length > 0 && (
          <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {msg.attachments.map((file, i) => (
              <Paper key={i} elevation={2} sx={{ p: 1, maxWidth: 200 }}>
                <Typography variant="caption">{file}</Typography>
              </Paper>
            ))}
          </Box>
        )}
      </>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxWidth: "800px",
        margin: "0 auto",
        padding: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          mb: 2,
        }}
      >
        <img
          src={logo}
          alt="Chatbot Logo"
          style={{
            height: "50px",
            width: "auto",
          }}
        />
        <Typography variant="h4" component="h1">
          Lambdac AI
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {modelsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="model-select-label">AI Model</InputLabel>
          <Select
            labelId="model-select-label"
            value={selectedModel}
            label="AI Model"
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={loading}
          >
            {models.map((model) => (
              <MenuItem key={model.name} value={model.name}>
                {model.name} ({Math.round(model.size / 1000000000)}GB)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        multiple
      />

      <Paper elevation={3} sx={{ flexGrow: 1, overflow: "auto", mb: 2 }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem
              key={index}
              sx={{
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  bgcolor:
                    msg.role === "user" ? "primary.light" : "background.paper",
                  color:
                    msg.role === "user"
                      ? "primary.contrastText"
                      : "text.primary",
                  maxWidth: "80%",
                }}
              >
                <ListItemText
                  primary={renderMessageContent(msg)}
                  secondary={msg.role === "user" ? "You" : "AI Assistant"}
                />
              </Paper>
            </ListItem>
          ))}
        </List>
      </Paper>
      {attachments.length > 0 && (
        <Paper
          elevation={1}
          sx={{ p: 1, mb: 1, display: "flex", flexWrap: "wrap", gap: 1 }}
        >
          {attachments.map((file, index) => (
            <Box key={index} sx={{ position: "relative" }}>
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
              ) : (
                <Paper
                  sx={{
                    p: 1,
                    width: 100,
                    height: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="caption" noWrap>
                    {file.name}
                  </Typography>
                </Paper>
              )}
              <IconButton
                size="small"
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  bgcolor: "error.main",
                  color: "white",
                  "&:hover": { bgcolor: "error.dark" },
                }}
                onClick={() => removeAttachment(index)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Paper>
      )}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", gap: 1 }}
      >
        <IconButton
          color="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <Badge badgeContent={attachments.length} color="primary">
            <AttachFileIcon />
          </Badge>
        </IconButton>

        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message or attach files..."
          disabled={loading || modelsLoading}
        />

        <Button
          type="submit"
          variant="contained"
          endIcon={<SendIcon />}
          disabled={
            (!input.trim() && !attachments.length) || loading || modelsLoading
          }
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}
