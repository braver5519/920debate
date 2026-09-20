export interface DiscussionOption {
  id: string;
  label: string;
  color: 'emerald' | 'rose' | 'amber' | 'sky' | 'indigo' | 'purple';
  emoji: string;
  description?: string;
}

export interface DiscussionTopic {
  id: string;
  title: string;
  situation: string; // 친절한 배경 설명
  guideQuestion: string; // 생각 도우미 질문
  type: 'pros_cons' | 'perspective'; // 찬반 토의 또는 관점 선택 토의
  options: DiscussionOption[];
  isActive: boolean;
  createdAt: string;
  grade: string; // 대상 학년
  classNum: string; // 대상 반
}

export interface OpinionSubmission {
  id: string;
  topicId: string;
  topicTitle: string;
  grade: string;
  classNum: string;
  studentNumber: string;
  studentName: string;
  optionId: string;
  optionLabel: string;
  reason: string;
  submittedAt: string;
  likes: number;
  syncedToSheet?: boolean;
}

export interface StudentProfile {
  grade: string;
  classNum: string;
  studentNumber: string;
  studentName: string;
}

export interface ClassStudent {
  studentNumber: string;
  studentName: string;
}

export interface GoogleSheetConfig {
  webAppUrl: string;
  lastTestedAt: string | null;
  isVerified: boolean;
  autoSync: boolean;
  syncCount: number;
}
