import { Course, CourseReview, Professor, Department } from '../models/Course';
export declare class DataService {
    private courses;
    private reviews;
    private professors;
    private departments;
    private isDataLoaded;
    constructor();
    loadData(): Promise<void>;
    private processRawData;
    private normalizeCourseCode;
    private extractDepartment;
    private extractProfessorName;
    private extractSemester;
    private parseDate;
    private calculateDifficultyDistribution;
    private getLatestDate;
    private extractTeachingCharacteristics;
    private getDepartmentName;
    getAllCourses(): Promise<Course[]>;
    getCourse(courseCode: string): Promise<Course | null>;
    searchCourses(query?: string, department?: string, maxDifficulty?: number): Promise<Course[]>;
    getCourseReviews(courseCode: string): Promise<CourseReview[]>;
    getProfessor(professorName: string): Promise<Professor | null>;
    getDepartment(deptCode: string): Promise<Department | null>;
    getAllDepartments(): Promise<Department[]>;
}
export declare const dataService: DataService;
//# sourceMappingURL=DataService.d.ts.map