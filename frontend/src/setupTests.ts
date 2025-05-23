/**
 * Test setup for Jest
 */
import '@testing-library/jest-dom';

// Mock the global variables provided by browser in tests
if (typeof window !== 'undefined') {
  // Mock MediaRecorder API
  if (!window.MediaRecorder) {
    window.MediaRecorder = class MockMediaRecorder {
      static isTypeSupported(mimeType: string) {
        return true;
      }
      
      start = jest.fn();
      stop = jest.fn();
      pause = jest.fn();
      resume = jest.fn();
      ondataavailable: ((event: any) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: ((error: any) => void) | null = null;
      
      constructor(public stream: MediaStream, public options: any = {}) {}
    } as any;
  }
  
  // Mock navigator.mediaDevices if not available
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        })
      },
      writable: true
    });
  }
}

// Set the global timeout for async tests to 10 seconds
jest.setTimeout(10000);
