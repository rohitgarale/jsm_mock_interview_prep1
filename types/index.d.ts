interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface User {
  name: string;
  email: string;
  id: string;
}

interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}

// Add these interfaces to your types file (e.g., types/index.ts)

// Enhanced User Profile interface
interface UserProfile {
    id: string;
    userId: string;
    interests: string[]; // e.g., ["React", "JavaScript", "Frontend Development"]
    experienceLevel: "Beginner" | "Intermediate" | "Advanced";
    preferredJobRoles: string[]; // e.g., ["Frontend Developer", "Full Stack Developer"]
    skills: string[]; // e.g., ["TypeScript", "Next.js", "CSS"]
    createdAt: any; // Firebase Timestamp
    updatedAt: any; // Firebase Timestamp
}

// Enhanced Interview interface (extends your existing one)
interface Interview {
    id: string;
    userId: string;

    // Core fields (keep your existing ones)
    title?: string;
    role?: string; // for backward compatibility
    type?: string; // for backward compatibility
    techstack?: string; // for backward compatibility
    createdAt: any;
    finalized?: boolean;

    // New enhanced fields
    jobRole?: string; // replaces/supplements 'role'
    category?: string; // replaces/supplements 'type'
    difficulty?: "Easy" | "Medium" | "Hard";
    tags?: string[]; // replaces/supplements 'techstack'
    estimatedDuration?: number; // in minutes
    isPublic?: boolean; // whether others can take this interview
    updatedAt?: any;

    // For recommended interviews
    relevanceScore?: number; // calculated score for user relevance

    // Additional metadata
    questions?: InterviewQuestion[];
    transcript?: TranscriptEntry[];

    // For display purposes
    score?: number; // from feedback
}

// Supporting interfaces
interface InterviewQuestion {
    id: string;
    question: string;
    expectedAnswer?: string;
    category: string;
    difficulty: "Easy" | "Medium" | "Hard";
}

interface TranscriptEntry {
    role: "interviewer" | "candidate";
    content: string;
    timestamp: number;
}

// Enhanced Feedback interface (extends your existing one)
interface Feedback {
    id: string;
    interviewId: string;
    userId: string;
    totalScore: number;
    categoryScores: any;
    strengths: string[];
    areasForImprovement: string[];
    finalAssessment: string;
    createdAt: string;
}

// Parameter interfaces for your functions
interface CreateFeedbackParams {
    interviewId: string;
    userId: string;
    transcript: { role: string; content: string }[];
    feedbackId?: string;
}

interface GetFeedbackByInterviewIdParams {
    interviewId: string;
    userId: string;
}

interface GetLatestInterviewsParams {
    userId: string;
    limit?: number;
}

// New parameter interfaces for enhanced functionality
interface CreateEnhancedInterviewParams {
    userId: string;
    title: string;
    jobRole: string;
    category?: string;
    difficulty?: "Easy" | "Medium" | "Hard";
    tags?: string[];
    estimatedDuration?: number;
    isPublic?: boolean;
}

interface SearchInterviewsParams {
    userId: string;
    category?: string;
    tags?: string[];
    difficulty?: "Easy" | "Medium" | "Hard";
    jobRole?: string;
    limit?: number;
}

// User stats interface
interface UserInterviewStats {
    totalCompleted: number;
    totalTimePracticed: number; // in minutes
    averageScore: number;
    categoryBreakdown: Record<string, number>;
    difficultyBreakdown: Record<string, number>;
}

// Component prop interfaces
interface InterviewCardProps {
    userId?: string;
    interviewId: string;
    role?: string;
    type?: string;
    techstack?: string;
    createdAt: any;

    // New enhanced props
    jobRole?: string;
    category?: string;
    difficulty?: "Easy" | "Medium" | "Hard";
    tags?: string[];
    estimatedDuration?: number;
    relevanceScore?: number;
    score?: number;
    isUserInterview?: boolean;
    isRecommended?: boolean;
}

interface UserProfileSetupProps {
    userId: string;
    onComplete?: () => void;
}

interface InterviewFiltersProps {
    currentParams?: {
        category?: string;
        difficulty?: string;
        tags?: string;
    };
    onFilterChange?: (filters: any) => void;
}

// Constants for dropdown options
export const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

export const INTERVIEW_CATEGORIES = [
    "Technical",
    "Behavioral",
    "System Design",
    "Coding Challenge"
] as const;

export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"] as const;

export const POPULAR_INTERESTS = [
    "React", "JavaScript", "TypeScript", "Node.js", "Python", "Java",
    "Frontend Development", "Backend Development", "Full Stack Development",
    "System Design", "Database Design", "API Development", "DevOps",
    "Cloud Computing", "Machine Learning", "Data Science", "Mobile Development",
    "Vue.js", "Angular", "Next.js", "Express.js", "MongoDB", "PostgreSQL",
    "AWS", "Docker", "Kubernetes", "GraphQL", "REST APIs", "Microservices"
] as const;

export const JOB_ROLES = [
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Software Engineer", "Senior Software Engineer", "Tech Lead",
    "Product Manager", "Data Scientist", "DevOps Engineer", "System Architect",
    "UI/UX Designer", "Mobile Developer", "Cloud Engineer", "Security Engineer"
] as const;