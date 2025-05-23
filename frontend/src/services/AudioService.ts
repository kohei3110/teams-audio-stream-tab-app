/**
 * Audio recording and streaming service for Teams tab application
 */

// WebSocket message types
export enum MessageType {
  CONNECTION = 'connection',
  START = 'start',
  STOP = 'stop',
  AUDIOCHUNK = 'audioChunk',
  ERROR = 'error'
}

// Connection status
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Recording status
export enum RecordingStatus {
  INACTIVE = 'inactive',
  RECORDING = 'recording',
  PAUSED = 'paused',
  ERROR = 'error'
}

// Service interface
export interface IAudioService {
  connect(url: string): Promise<void>;
  disconnect(): void;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  getConnectionStatus(): ConnectionStatus;
  getRecordingStatus(): RecordingStatus;
  onStatusChange(callback: (status: { connection: ConnectionStatus, recording: RecordingStatus }) => void): void;
}

// Default audio constraints
const DEFAULT_AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: false
};

/**
 * Audio service implementation for recording and streaming audio over WebSocket
 */
export class AudioService implements IAudioService {
  private socket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private recordingStatus: RecordingStatus = RecordingStatus.INACTIVE;
  private statusChangeCallbacks: ((status: { connection: ConnectionStatus, recording: RecordingStatus }) => void)[] = [];
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  /**
   * Connect to WebSocket server
   * @param url WebSocket server URL
   */
  public async connect(url: string): Promise<void> {
    if (this.socket && this.connectionStatus === ConnectionStatus.CONNECTED) {
      console.info('Already connected to WebSocket server');
      return;
    }

    this.setConnectionStatus(ConnectionStatus.CONNECTING);

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.info('WebSocket connection established');
        this.setConnectionStatus(ConnectionStatus.CONNECTED);
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.setConnectionStatus(ConnectionStatus.ERROR);
      };

      this.socket.onclose = () => {
        console.info('WebSocket connection closed');
        this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
        this.socket = null;

        // Auto-reconnect logic
        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.reconnectAttempts++;
          console.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);
          setTimeout(() => {
            this.connect(url).catch(console.error);
          }, 2000 * this.reconnectAttempts); // Exponential backoff
        }
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      this.setConnectionStatus(ConnectionStatus.ERROR);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.recordingStatus === RecordingStatus.RECORDING) {
      this.stopRecording().catch(console.error);
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
  }
  /**
   * Start recording audio
   */
  public async startRecording(): Promise<void> {
    if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
      throw new Error('Not connected to WebSocket server');
    }

    if (this.recordingStatus === RecordingStatus.RECORDING) {
      console.info('Already recording');
      return;
    }

    try {
      // Request media stream with more detailed error handling
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia(DEFAULT_AUDIO_CONSTRAINTS);
      } catch (err) {
        console.error('Failed to get user media:', err);
        // More detailed error message based on the error type
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            throw new Error('マイクへのアクセスが拒否されました。ブラウザの設定でマイクの許可を確認してください。');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            throw new Error('マイクが見つかりませんでした。マイクが接続されているか確認してください。');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            throw new Error('マイクにアクセスできませんでした。他のアプリケーションがマイクを使用している可能性があります。');
          } else if (err.name === 'OverconstrainedError') {
            throw new Error('指定された制約を満たすマイクが見つかりませんでした。');
          } else if (err.name === 'TypeError') {
            throw new Error('無効な制約が指定されました。');
          }
        }
        throw new Error('マイクへのアクセス中にエラーが発生しました: ' + (err instanceof Error ? err.message : String(err)));
      }
        // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000 // Lower bitrate for more efficient streaming
      });

      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.socket && this.socket.readyState === WebSocket.OPEN) {
          // Log the size of the audio chunk for debugging
          console.debug(`Sending audio chunk: ${event.data.size} bytes`);
          
          // Send the binary audio data
          this.socket.send(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        this.setRecordingStatus(RecordingStatus.INACTIVE);
        
        // Stop all tracks in the media stream
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(track => track.stop());
          this.mediaStream = null;
        }
      };

      // Handle recording errors
      this.mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        this.setRecordingStatus(RecordingStatus.ERROR);
      };

      // Send start message to server
      if (this.socket) {
        this.socket.send(JSON.stringify({ type: MessageType.START }));
      }      // Start recording with smaller chunks for Teams environment
      this.mediaRecorder.start(500); // 500ms chunks for better streaming in Teams
      this.setRecordingStatus(RecordingStatus.RECORDING);
      console.info('Recording started');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.setRecordingStatus(RecordingStatus.ERROR);
      throw error;
    }
  }

  /**
   * Stop recording audio
   */
  public async stopRecording(): Promise<void> {
    if (this.recordingStatus !== RecordingStatus.RECORDING) {
      console.info('Not currently recording');
      return;
    }

    try {
      // Send stop message to server
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: MessageType.STOP }));
      }

      // Stop media recorder
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      // Stop all tracks in the media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      this.setRecordingStatus(RecordingStatus.INACTIVE);
      console.info('Recording stopped');
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.setRecordingStatus(RecordingStatus.ERROR);
      throw error;
    }
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get current recording status
   */
  public getRecordingStatus(): RecordingStatus {
    return this.recordingStatus;
  }

  /**
   * Register callback for status changes
   * @param callback Function to call when status changes
   */
  public onStatusChange(callback: (status: { connection: ConnectionStatus, recording: RecordingStatus }) => void): void {
    this.statusChangeCallbacks.push(callback);
  }

  /**
   * Set connection status and notify listeners
   * @param status New connection status
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.notifyStatusChange();
  }

  /**
   * Set recording status and notify listeners
   * @param status New recording status
   */
  private setRecordingStatus(status: RecordingStatus): void {
    this.recordingStatus = status;
    this.notifyStatusChange();
  }

  /**
   * Notify status change listeners
   */
  private notifyStatusChange(): void {
    const status = {
      connection: this.connectionStatus,
      recording: this.recordingStatus
    };
    
    this.statusChangeCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }

  /**
   * Handle messages from WebSocket server
   * @param event WebSocket message event
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case MessageType.CONNECTION:
          console.info(`Connection established with userId: ${message.userId}`);
          break;
          
        case MessageType.START:
          console.info('Server acknowledged recording start');
          break;
          
        case MessageType.STOP:
          console.info('Server acknowledged recording stop');
          break;
          
        case MessageType.AUDIOCHUNK:
          // Server acknowledged receipt of audio chunk
          break;
          
        case MessageType.ERROR:
          console.error('Server error:', message.message);
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
      
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }
}

// Create singleton instance
export const audioService = new AudioService();
export default audioService;
