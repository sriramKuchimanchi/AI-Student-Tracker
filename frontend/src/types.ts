export interface Class {
  id: number;
  name: string;
  created_at: string;
}

export interface Section {
  id: number;
  class_id: number;
  name: string;
  created_at: string;
}

export interface ClassWithSections extends Class {
  sections: Section[];
  student_count: number;
}

export interface Student {
  id: number;
  name: string;
  roll_number: string;
  class: string;
  section: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  created_at: string;
}

export interface Exam {
  id: number;
  name: string;
  class: string;
  section: string | null;
  exam_date: string | null;
  subjects: string;
  max_marks: number;
  created_at: string;
}

export interface MarkWithDetails {
  id: number;
  student_id: number;
  exam_id: number;
  subject_name: string;
  marks_obtained: number;
  max_marks: number;
  exam_name: string;
  exam_date: string | null;
  percentage: string;
}

export interface PerformanceRow {
  subject_name: string;
  max_marks: number;
  average_marks: string;
  min_marks: number;
  max_marks_obtained: number;
  exam_count: string;
  percentage: string;
}

export interface MarkEntry {
  subject_name: string;
  marks_obtained: number;
}

export interface ReportSummary {
  total_average: string;
  grade: string;
  weak_subjects: string[];
  total_exams: number;
}

export interface ParentReport {
  student: Student;
  marks: MarkWithDetails[];
  performance: PerformanceRow[];
  summary: ReportSummary;
}