export interface RawCourseData {
    Class: string;
    "Average Difficulty": string;
    "Additional Comments": string;
    Difficulty: string;
    Date: string;
}
export interface Course {
    course_code: string;
    department: string;
    average_difficulty: number;
    total_reviews: number;
    difficulty_distribution: {
        very_easy: number;
        easy: number;
        moderate: number;
        hard: number;
        very_hard: number;
    };
    latest_review_date: string;
    created_at: string;
}
export interface CourseReview {
    course_code: string;
    difficulty: number;
    comment: string;
    professor_name: string | null;
    review_date: string;
    semester: string | null;
}
export interface Professor {
    name: string;
    courses_taught: string[];
    average_difficulty: number;
    total_reviews: number;
    teaching_characteristics: string[];
    latest_review_date: string;
}
export interface EnhancedProfessor extends Professor {
    first_name: string;
    last_name: string;
    department: string;
    school: string;
    rmp_rating: number;
    rmp_difficulty: number;
    rmp_num_ratings: number;
    would_take_again: number | null;
    rmp_tags: string[];
    professor_id: string | null;
    school_id: string | null;
    reddit_sentiment: {
        score: number;
        confidence: number;
        mention_count: number;
        positive_mentions: number;
        negative_mentions: number;
        recent_mentions: {
            text: string;
            subreddit: string;
            score: number;
            date: string;
        }[];
    } | null;
    data_quality: 'high' | 'medium' | 'low';
    data_sources: string[];
    combined_rating: number;
    last_updated: string;
    recommendation_score: number;
    teaching_style_summary: string;
    pros: string[];
    cons: string[];
}
export interface Department {
    code: string;
    name: string;
    total_courses: number;
    average_difficulty: number;
    easiest_courses: string[];
    hardest_courses: string[];
    most_reviewed_courses: string[];
}
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
export interface ApiError {
    success: false;
    error: string;
    message: string;
    timestamp: string;
    code?: number;
}
//# sourceMappingURL=Course.d.ts.map