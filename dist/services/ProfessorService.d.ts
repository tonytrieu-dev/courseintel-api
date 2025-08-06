import { EnhancedProfessor, Professor } from '../models/Course';
export declare class ProfessorService {
    private cache;
    private baseUrl;
    private isEnabled;
    constructor();
    getEnhancedProfessor(professorName: string, basicData: Professor): Promise<EnhancedProfessor>;
    searchProfessors(query: string, school?: string, department?: string, minRating?: number): Promise<{
        professors: EnhancedProfessor[];
        total_results: number;
    }>;
    getProfessorAnalytics(professorName: string): Promise<{
        recommendation_score: number;
        teaching_style_summary: string;
        pros: string[];
        cons: string[];
        data_quality: 'high' | 'medium' | 'low';
    } | null>;
    private combineData;
    private fallbackToBasicData;
    private extractDepartmentFromCourses;
    private assessDataQuality;
    private getDataSources;
    private calculateRecommendationScore;
    private generateTeachingStyleSummary;
    private extractPros;
    private extractCons;
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unavailable';
        response_time?: number;
    }>;
    clearCache(professorName?: string): void;
    getCacheStats(): {
        keys: number;
        hits: number;
        misses: number;
    };
}
export declare const professorService: ProfessorService;
//# sourceMappingURL=ProfessorService.d.ts.map