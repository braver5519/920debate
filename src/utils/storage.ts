import { DiscussionTopic, OpinionSubmission, ClassStudent, GoogleSheetConfig, StudentProfile } from '../types';
import { INITIAL_TOPICS, INITIAL_ROSTER, INITIAL_SUBMISSIONS, CONFIGURED_GOOGLE_SHEET_URL } from '../data/initialData';

const STORAGE_KEYS = {
  TOPICS: 'class_discussion_topics_v1',
  ACTIVE_TOPIC_ID: 'class_discussion_active_topic_id_v1',
  SUBMISSIONS: 'class_discussion_submissions_v1',
  ROSTER: 'class_discussion_roster_v1',
  SHEET_CONFIG: 'class_discussion_sheet_config_v1',
  STUDENT_PROFILE: 'class_discussion_student_profile_v1',
  TEACHER_PIN: 'class_discussion_teacher_pin_v1',
};

export const storage = {
  getTopics(): DiscussionTopic[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TOPICS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load topics from localStorage', e);
    }
    return INITIAL_TOPICS;
  },

  saveTopics(topics: DiscussionTopic[]): void {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  },

  getActiveTopicId(): string {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_TOPIC_ID);
    if (active) return active;
    const topics = this.getTopics();
    const activeTopic = topics.find(t => t.isActive) || topics[0];
    return activeTopic ? activeTopic.id : '';
  },

  setActiveTopicId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TOPIC_ID, id);
  },

  getSubmissions(): OpinionSubmission[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load submissions', e);
    }
    return INITIAL_SUBMISSIONS;
  },

  saveSubmissions(submissions: OpinionSubmission[]): void {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  },

  addSubmission(submission: OpinionSubmission): OpinionSubmission[] {
    const list = this.getSubmissions();
    const updated = [submission, ...list];
    this.saveSubmissions(updated);
    return updated;
  },

  toggleLike(submissionId: string): OpinionSubmission[] {
    const list = this.getSubmissions();
    const updated = list.map(sub => {
      if (sub.id === submissionId) {
        return { ...sub, likes: sub.likes + 1 };
      }
      return sub;
    });
    this.saveSubmissions(updated);
    return updated;
  },

  getRoster(): ClassStudent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROSTER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load roster', e);
    }
    return INITIAL_ROSTER;
  },

  saveRoster(roster: ClassStudent[]): void {
    localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(roster));
  },

  getSheetConfig(): GoogleSheetConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHEET_CONFIG);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.webAppUrl && parsed.webAppUrl.trim()) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load sheet config', e);
    }
    const defaultConfig: GoogleSheetConfig = {
      webAppUrl: CONFIGURED_GOOGLE_SHEET_URL,
      lastTestedAt: new Date().toLocaleDateString('ko-KR'),
      isVerified: true,
      autoSync: true,
      syncCount: 0
    };
    try {
      localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(defaultConfig));
    } catch {
      // ignore
    }
    return defaultConfig;
  },

  saveSheetConfig(config: GoogleSheetConfig): void {
    localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(config));
  },

  getStudentProfile(): StudentProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load student profile', e);
    }
    return {
      grade: '4',
      classNum: '2',
      studentNumber: '',
      studentName: ''
    };
  },

  saveStudentProfile(profile: StudentProfile): void {
    localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(profile));
  },

  getTeacherPin(): string {
    return localStorage.getItem(STORAGE_KEYS.TEACHER_PIN) || '1234';
  },

  saveTeacherPin(pin: string): void {
    localStorage.setItem(STORAGE_KEYS.TEACHER_PIN, pin);
  },

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.TOPICS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TOPIC_ID);
    localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.ROSTER);
    localStorage.removeItem(STORAGE_KEYS.SHEET_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.STUDENT_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.TEACHER_PIN);
  }
};
