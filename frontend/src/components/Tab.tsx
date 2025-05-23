import { useContext } from "react";
import { TeamsFxContext } from "./Context";
import { Text, Divider } from "@fluentui/react-components";
import AudioRecorder from "./AudioRecorder";

// WebSocket server URL - in production, this should be a secure WebSocket URL (wss://)
// For local development, we use the local server
const WEBSOCKET_SERVER_URL = process.env.REACT_APP_WEBSOCKET_URL || "ws://localhost:3001";

export default function Tab() {
  const { themeString } = useContext(TeamsFxContext);
  
  return (
    <div
      className={themeString === "default" ? "light" : themeString === "dark" ? "dark" : "contrast"}
      style={{ padding: "1rem" }}
    >
      <Text as="h1" size={800} weight="semibold">Teams Audio Streaming App</Text>
      <Text as="p">
        This app captures your audio and streams it to a backend server via WebSocket.
        You can use the controls below to start and stop the audio recording.
      </Text>
      
      <Text as="p" style={{ marginTop: '0.5rem' }}>
        <strong>Note:</strong> For this app to work properly, you need to allow microphone access when prompted.
        If you've previously denied access, you'll need to change your browser's permission settings.
      </Text>
      
      <Divider style={{ margin: "1rem 0" }} />
      
      <AudioRecorder serverUrl={WEBSOCKET_SERVER_URL} />
    </div>
  );
}
