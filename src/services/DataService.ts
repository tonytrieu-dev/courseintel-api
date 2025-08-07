import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { RawCourseData, Course, CourseReview, Professor, Department } from '../models/Course';

export class DataService {
  private static instance: DataService;
  private courses: Course[] = [];
  private reviews: CourseReview[] = [];
  private professors: Professor[] = [];
  private departments: Department[] = [];
  private isDataLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  private constructor() {
    console.log('🏗️ DataService singleton instance created');
  }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Load and process CSV data with singleton caching
  async loadData(): Promise<void> {
    // If data is already loaded, return immediately
    if (this.isDataLoaded && this.courses.length > 0) {
      console.log('📦 Using cached data - instant response!');
      return;
    }

    // If loading is in progress, wait for it
    if (this.loadingPromise) {
      console.log('⏳ Data loading in progress, waiting...');
      await this.loadingPromise;
      return;
    }

    // Start loading process
    this.loadingPromise = this.performDataLoad();
    await this.loadingPromise;
    this.loadingPromise = null;
  }

  private async performDataLoad(): Promise<void> {
    const startTime = Date.now();
    console.log('🚀 Starting high-performance data loading...');

    try {
      const csvPath = path.join(process.cwd(), 'data', 'ucr-courses.csv');
      console.log('📊 Loading UCR course data from:', csvPath);
      
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const rawData: RawCourseData[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      console.log(`🔢 Found ${rawData.length} raw course records`);
      
      // Process the raw data
      await this.processRawData(rawData);
      
      this.isDataLoaded = true;
      const loadTime = Date.now() - startTime;
      console.log(`✅ Data processing complete in ${loadTime}ms!`);
      console.log(`📚 Processed: ${this.courses.length} courses, ${this.reviews.length} reviews, ${this.professors.length} professors`);
      console.log('🏆 Data cached permanently for instant future requests');
      
    } catch (error) {
      console.error('❌ Error loading course data:', error);
      this.loadingPromise = null;
      throw new Error('Failed to load course data');
    }
  }

  // Process raw CSV data into structured objects
  private async processRawData(rawData: RawCourseData[]): Promise<void> {
    const courseMap = new Map<string, CourseReview[]>();
    const professorMap = new Map<string, CourseReview[]>();
    const departmentSet = new Set<string>();

    // Process each row into a review
    for (const row of rawData) {
      if (!row.Class || !row.Difficulty) continue;

      const courseCode = this.normalizeCourseCode(row.Class);
      if (!courseCode) continue;

      const difficulty = parseInt(row.Difficulty);
      if (isNaN(difficulty) || difficulty < 1 || difficulty > 10) continue;

      const department = this.extractDepartment(courseCode);
      departmentSet.add(department);

      const review: CourseReview = {
        course_code: courseCode,
        difficulty: difficulty,
        comment: row["Additional Comments"] || '',
        professor_name: this.extractProfessorName(row["Additional Comments"]),
        review_date: this.parseDate(row.Date),
        semester: this.extractSemester(row["Additional Comments"])
      };

      this.reviews.push(review);

      // Group by course
      if (!courseMap.has(courseCode)) {
        courseMap.set(courseCode, []);
      }
      courseMap.get(courseCode)!.push(review);

      // Group by professor
      if (review.professor_name) {
        if (!professorMap.has(review.professor_name)) {
          professorMap.set(review.professor_name, []);
        }
        professorMap.get(review.professor_name)!.push(review);
      }
    }

    // Create course objects
    this.courses = Array.from(courseMap.entries()).map(([courseCode, reviews]) => {
      const difficulties = reviews.map(r => r.difficulty);
      const avgDifficulty = difficulties.reduce((a, b) => a + b, 0) / difficulties.length;
      
      return {
        course_code: courseCode,
        department: this.extractDepartment(courseCode),
        average_difficulty: Math.round(avgDifficulty * 100) / 100,
        total_reviews: reviews.length,
        difficulty_distribution: this.calculateDifficultyDistribution(difficulties),
        latest_review_date: this.getLatestDate(reviews.map(r => r.review_date)),
        created_at: new Date().toISOString()
      };
    });

    // Create professor objects
    this.professors = Array.from(professorMap.entries()).map(([name, reviews]) => {
      const difficulties = reviews.map(r => r.difficulty);
      const avgDifficulty = difficulties.reduce((a, b) => a + b, 0) / difficulties.length;
      const coursesSet = new Set(reviews.map(r => r.course_code));
      
      return {
        name: name,
        courses_taught: Array.from(coursesSet),
        average_difficulty: Math.round(avgDifficulty * 100) / 100,
        total_reviews: reviews.length,
        teaching_characteristics: this.extractTeachingCharacteristics(reviews),
        latest_review_date: this.getLatestDate(reviews.map(r => r.review_date))
      };
    });

    // Create department objects
    this.departments = Array.from(departmentSet).map(deptCode => {
      const deptCourses = this.courses.filter(c => c.department === deptCode);
      const avgDifficulty = deptCourses.reduce((sum, c) => sum + c.average_difficulty, 0) / deptCourses.length;
      
      const sortedByDifficulty = [...deptCourses].sort((a, b) => a.average_difficulty - b.average_difficulty);
      const sortedByReviews = [...deptCourses].sort((a, b) => b.total_reviews - a.total_reviews);
      
      return {
        code: deptCode,
        name: this.getDepartmentName(deptCode),
        total_courses: deptCourses.length,
        average_difficulty: Math.round(avgDifficulty * 100) / 100,
        easiest_courses: sortedByDifficulty.slice(0, 3).map(c => c.course_code),
        hardest_courses: sortedByDifficulty.slice(-3).reverse().map(c => c.course_code),
        most_reviewed_courses: sortedByReviews.slice(0, 5).map(c => c.course_code)
      };
    });
  }

  // Utility functions
  private normalizeCourseCode(code: string): string {
    return code.trim().toUpperCase().replace(/\s+/g, '');
  }

  private extractDepartment(courseCode: string): string {
    const match = courseCode.match(/^([A-Z]+)/);
    return match ? match[1] : 'UNKNOWN';
  }

  private extractProfessorName(comment: string): string | null {
    if (!comment) return null;
    
    // Look for professor patterns: "Prof. Name", "Professor Name", "Dr. Name"
    const patterns = [
      /(?:Prof\.?\s+|Professor\s+|Dr\.?\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /([A-Z][a-z]+)\s+(?:is|was)/i
    ];
    
    for (const pattern of patterns) {
      const match = comment.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  private extractSemester(comment: string): string | null {
    if (!comment) return null;
    
    const seasonYear = comment.match(/(Fall|Spring|Summer|Winter)\s+(\d{4})/i);
    if (seasonYear) {
      return `${seasonYear[1]} ${seasonYear[2]}`;
    }
    
    return null;
  }

  private parseDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();
    
    try {
      const date = new Date(dateStr);
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private calculateDifficultyDistribution(difficulties: number[]) {
    return {
      very_easy: difficulties.filter(d => d <= 2).length,
      easy: difficulties.filter(d => d >= 3 && d <= 4).length,
      moderate: difficulties.filter(d => d >= 5 && d <= 6).length,
      hard: difficulties.filter(d => d >= 7 && d <= 8).length,
      very_hard: difficulties.filter(d => d >= 9).length
    };
  }

  private getLatestDate(dates: string[]): string {
    return dates.reduce((latest, current) => {
      return new Date(current) > new Date(latest) ? current : latest;
    });
  }

  private extractTeachingCharacteristics(reviews: CourseReview[]): string[] {
    const characteristics = new Set<string>();
    const comments = reviews.map(r => r.comment.toLowerCase()).join(' ');
    
    // Simple keyword extraction
    const patterns = [
      { pattern: /easy|simple|straightforward/i, char: 'Easy grading' },
      { pattern: /hard|difficult|challenging/i, char: 'Challenging' },
      { pattern: /attendance|present|show up/i, char: 'Attendance required' },
      { pattern: /online|recorded|async/i, char: 'Online/recorded lectures' },
      { pattern: /quiz|test|exam/i, char: 'Regular assessments' },
      { pattern: /essay|paper|writing/i, char: 'Writing assignments' },
      { pattern: /extra credit/i, char: 'Extra credit offered' },
      { pattern: /engaging|interesting|fun/i, char: 'Engaging teaching style' }
    ];
    
    patterns.forEach(({ pattern, char }) => {
      if (pattern.test(comments)) {
        characteristics.add(char);
      }
    });
    
    return Array.from(characteristics).slice(0, 5); // Max 5 characteristics
  }

  private getDepartmentName(code: string): string {
    const deptNames: { [key: string]: string } = {
      'AHS': 'Applied Health Sciences',
      'ANTH': 'Anthropology',
      'CS': 'Computer Science',
      'MATH': 'Mathematics',
      'PHYS': 'Physics',
      'CHEM': 'Chemistry',
      'BIOL': 'Biology',
      'ENGL': 'English',
      'HIST': 'History',
      'PSYC': 'Psychology',
      'ECON': 'Economics',
      'PHIL': 'Philosophy',
      'POLS': 'Political Science'
    };
    
    return deptNames[code] || code;
  }

  // Public API methods with caching
  async getAllCourses(): Promise<Course[]> {
    await this.loadData();
    return this.courses;
  }

  async getCourse(courseCode: string): Promise<Course | null> {
    await this.loadData();
    const course = this.courses.find(c => c.course_code === courseCode.toUpperCase());
    return course || null;
  }

  async searchCourses(query?: string, department?: string, maxDifficulty?: number): Promise<Course[]> {
    await this.loadData();
    
    let filtered = [...this.courses];
    
    if (query) {
      const queryUpper = query.toUpperCase();
      filtered = filtered.filter(c => 
        c.course_code.includes(queryUpper) || 
        c.department.includes(queryUpper)
      );
    }
    
    if (department) {
      filtered = filtered.filter(c => c.department === department.toUpperCase());
    }
    
    if (maxDifficulty !== undefined) {
      filtered = filtered.filter(c => c.average_difficulty <= maxDifficulty);
    }
    
    return filtered;
  }

  async getCourseReviews(courseCode: string): Promise<CourseReview[]> {
    await this.loadData();
    return this.reviews.filter(r => r.course_code === courseCode.toUpperCase());
  }

  async getProfessor(professorName: string): Promise<Professor | null> {
    await this.loadData();
    const prof = this.professors.find(p => 
      p.name.toLowerCase().includes(professorName.toLowerCase())
    );
    return prof || null;
  }

  async getDepartment(deptCode: string): Promise<Department | null> {
    await this.loadData();
    const dept = this.departments.find(d => d.code === deptCode.toUpperCase());
    return dept || null;
  }

  async getAllDepartments(): Promise<Department[]> {
    await this.loadData();
    return this.departments;
  }
}

// Singleton instance - use getInstance() for optimal performance
export const dataService = DataService.getInstance();