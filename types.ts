export interface CapturedFrame {
  id: string;
  dataUrl: string; // Base64 image
  timestamp: number; // Video timestamp in seconds
  createdAt: number;
  isGenerated?: boolean; // Flag to distinguish captured vs AI generated
  width?: number;
  height?: number;
}

export interface AnalysisResult {
  chineseDescription: string;
  englishPrompt: string;
}

export interface GeneratedImage {
  id: string;
  dataUrl: string;
  promptUsed: string;
  createdAt: number;
}

export interface GeneratedVideo {
  videoUrl: string;
  promptUsed: string;
  createdAt: number;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
}

export enum WorkflowStep {
  CAPTURE = 'CAPTURE',
  CREATIVE = 'CREATIVE',
  VEO = 'VEO'
}