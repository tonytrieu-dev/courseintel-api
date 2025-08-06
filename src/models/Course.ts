// Raw CSV data structure from UCR spreadsheet
export interface RawCourseData {
  Class: string;                    // Course code (e.g., "AHS007")
  "Average Difficulty": string;     // Calculated average (could be empty)
  "Additional Comments": string;    // Student review text
  Difficulty: string;              // Individual rating (1-10)
  Date: string;                    // Review date (MM/DD/YYYY)
}

// Processed course data for API responses
export interface Course {
  course_code: string;
  department: string;
  average_difficulty: number;
  total_reviews: number;
  difficulty_distribution: {
    very_easy: number;    // 1-2
    easy: number;         // 3-4
    moderate: number;     // 5-6
    hard: number;         // 7-8
    very_hard: number;    // 9-10
  };
  latest_review_date: string;
  created_at: string;
}

// Individual course review
export interface CourseReview {
  course_code: string;
  difficulty: number;
  comment: string;
  professor_name: string | null;
  review_date: string;
  semester: string | null;
}

// Professor summary data (basic UCR data)
export interface Professor {
  name: string;
  courses_taught: string[];
  average_difficulty: number;
  total_reviews: number;
  teaching_characteristics: string[];
  latest_review_date: string;
}

// Enhanced Professor data with RateMyProfessor + Reddit integration
export interface EnhancedProfessor extends Professor {
  first_name: string;
  last_name: string;
  department: string;
  school: string;
  
  // RateMyProfessor data
  rmp_rating: number;
  rmp_difficulty: number;
  rmp_num_ratings: number;
  would_take_again: number | null;
  rmp_tags: string[];
  professor_id: string | null;
  school_id: string | null;
  
  // Reddit sentiment data
  reddit_sentiment: {
    score: number;           // -1 to 1 (negative to positive)
    confidence: number;      // 0 to 1 (low to high confidence)
    mention_count: number;   // Number of Reddit mentions found
    positive_mentions: number;
    negative_mentions: number;
    recent_mentions: {
      text: string;
      subreddit: string;
      score: number;
      date: string;
    }[];
  } | null;
  
  // Data quality and sources
  data_quality: 'high' | 'medium' | 'low';
  data_sources: string[];
  combined_rating: number;  // Weighted combination of UCR + RMP + Reddit
  last_updated: string;
  
  // Enhanced analytics
  recommendation_score: number;  // 0-100 overall recommendation
  teaching_style_summary: string;
  pros: string[];
  cons: string[];
}

// Department statistics
export interface Department {
  code: string;
  name: string;
  total_courses: number;
  average_difficulty: number;
  easiest_courses: string[];
  hardest_courses: string[];
  most_reviewed_courses: string[];
}

// API response formats
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface SearchResponse {
  courses: Course[];
  total_results: number;
  filters_applied: {
    query?: string;
    department?: string;
    max_difficulty?: number;
    min_reviews?: number;
  };
}

export interface CourseDetailResponse extends Course {
  recent_reviews: CourseReview[];
  professors: Professor[];
}

export interface EnhancedCourseDetailResponse extends Course {
  recent_reviews: CourseReview[];
  professors: EnhancedProfessor[];
}

export interface ProfessorSearchResponse {
  professors: EnhancedProfessor[];
  total_results: number;
  filters_applied: {
    query?: string;
    school?: string;
    department?: string;
    min_rating?: number;
  };
}

// Error response format
export interface ApiError {
  success: false;
  error: string;
  message: string;
  timestamp: string;
  code?: number;
}