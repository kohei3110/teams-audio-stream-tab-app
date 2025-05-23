/**
 * Audio Recorder component for Teams tab application
 */
import React, { useState, useEffect } from 'react';
import {
  Button,
  Spinner,
  Text,
  Label,
  Card,
  CardHeader,
  makeStyles,
  tokens,
  useId,
  ProgressBar
} from '@fluentui/react-components';
import { MicRegular, MicOffRegular } from '@fluentui/react-icons';

import audioService, {
  ConnectionStatus,
  RecordingStatus
} from '../services/AudioService';

// Styles for the component
const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: tokens.spacingVerticalM,
    gap: tokens.spacingVerticalM,
    maxWidth: '600px',
    margin: '0 auto',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  statusContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalM,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  statusLabel: {
    minWidth: '100px',
  },
  statusValue: {
    fontWeight: tokens.fontWeightSemibold,
  },
  recordButton: {
    marginTop: tokens.spacingVerticalS,
  },  errorText: {
    color: tokens.colorPaletteRedForeground1,
    marginTop: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusMedium,
  },
  time: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase500,
  },
  progressContainer: {
    marginTop: tokens.spacingVerticalS,
  }
});

// Component props
interface AudioRecorderProps {
  serverUrl: string;
}

/**
 * AudioRecorder component
 */
const AudioRecorder: React.FC<AudioRecorderProps> = ({ serverUrl }) => {
  const styles = useStyles();
  const connectionStatusId = useId('connection-status');
  const recordingStatusId = useId('recording-status');

  // State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.INACTIVE);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Timer for recording time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (recordingStatus === RecordingStatus.RECORDING) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        // Update progress bar every second (random value for visual feedback)
        setProgress(Math.min(100, Math.floor(Math.random() * 20) + progress));
      }, 1000);
    } else {
      // Reset recording time when not recording
      setRecordingTime(0);
      setProgress(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [recordingStatus, progress]);

  // Connect to WebSocket server when component mounts
  useEffect(() => {
    const connectToServer = async () => {
      try {
        setIsConnecting(true);
        setError(null);
        await audioService.connect(serverUrl);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
        setError(`Connection error: ${errorMessage}`);
      } finally {
        setIsConnecting(false);
      }
    };

    // Register status change callback
    audioService.onStatusChange(({ connection, recording }) => {
      setConnectionStatus(connection);
      setRecordingStatus(recording);
      
      if (connection === ConnectionStatus.ERROR || recording === RecordingStatus.ERROR) {
        setError('An error occurred with audio service. Please try reconnecting.');
      }
    });

    // Connect to server
    connectToServer();

    // Cleanup on unmount
    return () => {
      audioService.disconnect();
    };
  }, [serverUrl]);

  // Format recording time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Connection status display
  const getConnectionStatusDisplay = (): { text: string; isError: boolean } => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return { text: 'Connected', isError: false };
      case ConnectionStatus.CONNECTING:
        return { text: 'Connecting...', isError: false };
      case ConnectionStatus.DISCONNECTED:
        return { text: 'Disconnected', isError: false };
      case ConnectionStatus.ERROR:
        return { text: 'Connection Error', isError: true };
      default:
        return { text: 'Unknown', isError: false };
    }
  };

  // Recording status display
  const getRecordingStatusDisplay = (): { text: string; isError: boolean } => {
    switch (recordingStatus) {
      case RecordingStatus.RECORDING:
        return { text: 'Recording', isError: false };
      case RecordingStatus.PAUSED:
        return { text: 'Paused', isError: false };
      case RecordingStatus.INACTIVE:
        return { text: 'Not Recording', isError: false };
      case RecordingStatus.ERROR:
        return { text: 'Recording Error', isError: true };
      default:
        return { text: 'Unknown', isError: false };
    }
  };
  // Handle start recording
  const handleStartRecording = async () => {
    try {
      setError(null);
      await audioService.startRecording();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(`${errorMessage}`);
      console.error('Recording error:', err);
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    try {
      setError(null);
      await audioService.stopRecording();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(`Recording error: ${errorMessage}`);
    }
  };

  // Handle reconnect
  const handleReconnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      audioService.disconnect();
      await audioService.connect(serverUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reconnect';
      setError(`Connection error: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Determine if recording button should be disabled
  const isRecordingDisabled = connectionStatus !== ConnectionStatus.CONNECTED || 
                            isConnecting || 
                            recordingStatus === RecordingStatus.ERROR;

  const connectionStatusDisplay = getConnectionStatusDisplay();
  const recordingStatusDisplay = getRecordingStatusDisplay();

  return (
    <Card className={styles.container}>
      <CardHeader header={<Text weight="semibold">Teams Audio Streaming</Text>} />
      
      <div className={styles.statusContainer}>
        <div className={styles.statusRow}>
          <Label className={styles.statusLabel} htmlFor={connectionStatusId}>Connection:</Label>
          <Text 
            id={connectionStatusId}
            className={connectionStatusDisplay.isError ? styles.errorText : styles.statusValue}
          >
            {connectionStatusDisplay.text}
          </Text>
          {isConnecting && <Spinner size="tiny" />}
        </div>
        
        <div className={styles.statusRow}>
          <Label className={styles.statusLabel} htmlFor={recordingStatusId}>Status:</Label>
          <Text 
            id={recordingStatusId}
            className={recordingStatusDisplay.isError ? styles.errorText : styles.statusValue}
          >
            {recordingStatusDisplay.text}
          </Text>
        </div>
        
        {recordingStatus === RecordingStatus.RECORDING && (
          <div className={styles.statusRow}>
            <Label className={styles.statusLabel}>Time:</Label>
            <Text className={styles.time}>{formatTime(recordingTime)}</Text>
          </div>
        )}
        
        {error && <Text className={styles.errorText}>{error}</Text>}
      </div>
      
      <div className={styles.controls}>
        {recordingStatus === RecordingStatus.RECORDING ? (
          <>
            <Button 
              appearance="primary" 
              icon={<MicOffRegular />}
              onClick={handleStopRecording}
            >
              Stop Recording
            </Button>
            <div className={styles.progressContainer}>
              <ProgressBar value={progress / 100} />
            </div>
          </>
        ) : (
          <Button 
            appearance="primary" 
            icon={<MicRegular />}
            onClick={handleStartRecording}
            disabled={isRecordingDisabled}
          >
            Start Recording
          </Button>
        )}
        
        {(connectionStatus === ConnectionStatus.DISCONNECTED || 
          connectionStatus === ConnectionStatus.ERROR) && (
          <Button 
            appearance="outline" 
            onClick={handleReconnect}
            disabled={isConnecting}
          >
            Reconnect
          </Button>
        )}
      </div>
    </Card>
  );
};

export default AudioRecorder;
