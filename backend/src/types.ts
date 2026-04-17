export interface Class {
  id: number;
  name: string;
  created_at: Date;
}

export interface Section {
  id: number;
  class_id: number;
  name: string;
  created_at: Date;
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
  section: string | null;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  created_at: Date;
}

export interface Exam {
  id: number;
  name: string;
  class: string;
  section: string | null;
  exam_date: Date | null;
  subjects: string;
  max_marks: number;
  created_at: Date;
}

export interface Mark {
  id: number;
  student_id: number;
  exam_id: number;
  subject_name: string;
  marks_obtained: number;
  created_at: Date;
}

export interface MarkEntry {
  subject_name: string;
  marks_obtained: number;
}

export interface MarkWithDetails {
  id: number;
  student_id: number;
  exam_id: number;
  subject_name: string;
  marks_obtained: number;
  max_marks: number;
  exam_name: string;
  exam_date: Date | null;
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

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  reset_token: string | null;
  reset_token_expires: Date | null;
  created_at: Date;
}

export interface AuthPayload {
  userId: number;
  email: string;
  name: string;
}