import type { OnboardingAnswers, ArchComponent } from "@/stores/project";

/**
 * Mock data for a hiring system - used for testing the bias detector.
 * TODO: Replace with MongoDB integration later.
 */

export const MOCK_HIRING_SYSTEM_ANSWERS: OnboardingAnswers = {
  idea: "AI-Powered Hiring Platform - An automated recruitment system that screens resumes, conducts initial assessments, and ranks candidates for job positions using machine learning algorithms",
  audience: "HR professionals, recruiters, and hiring managers at mid-to-large companies looking to streamline their recruitment process and find qualified candidates faster",
  flow: "Job posting creation → Resume submission → AI resume screening → Automated skill assessment → Video interview scheduling → AI interview analysis → Candidate ranking → HR review → Final decision",
};

export const MOCK_HIRING_SYSTEM_COMPONENTS: ArchComponent[] = [
  {
    id: "fe-portal",
    name: "Candidate Portal",
    kind: "frontend",
    description: "Web application where job seekers create profiles, upload resumes, complete assessments, and track their application status. Requires account creation with email verification.",
    why: "Candidates need a self-service interface to apply and monitor their applications.",
    pros: ["Self-service reduces HR workload", "Candidates can track status"],
    cons: ["Requires digital literacy", "May exclude candidates without reliable internet"],
    alternatives: [{ name: "Mobile App", reason: "Better accessibility for mobile-first users" }],
    x: 80,
    y: 120,
  },
  {
    id: "fe-hr",
    name: "HR Dashboard",
    kind: "frontend",
    description: "Internal dashboard for HR staff to manage job postings, review AI-ranked candidates, schedule interviews, and make hiring decisions. English-only interface.",
    why: "HR teams need centralized tools to manage the hiring pipeline.",
    pros: ["Centralized management", "Analytics and reporting"],
    cons: ["Learning curve for new staff", "English-only limits global teams"],
    alternatives: [{ name: "ATS Integration", reason: "Use existing applicant tracking systems" }],
    x: 80,
    y: 280,
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    kind: "api",
    description: "Handles authentication, rate limiting, and routes requests to appropriate services. Enforces strict data validation on all inputs.",
    why: "Centralizes security and routing concerns.",
    pros: ["Unified auth", "Rate limiting prevents abuse"],
    cons: ["Single point of failure", "May reject valid international formats"],
    alternatives: [{ name: "Service mesh", reason: "Distributed approach for larger scale" }],
    x: 380,
    y: 200,
  },
  {
    id: "ai-resume",
    name: "Resume Screening AI",
    kind: "ai",
    description: "Machine learning model trained on historical hiring data to parse resumes, extract skills, and score candidates. Uses NLP to analyze work experience and education credentials.",
    why: "Automates initial screening to handle high application volumes.",
    pros: ["Fast processing", "Consistent criteria", "Handles volume"],
    cons: ["May inherit historical biases", "Struggles with non-standard formats", "Favors certain keywords"],
    alternatives: [{ name: "Manual screening", reason: "More nuanced but slower" }],
    x: 660,
    y: 80,
  },
  {
    id: "ai-assessment",
    name: "Skill Assessment Engine",
    kind: "ai",
    description: "Automated testing platform that evaluates candidates through timed coding challenges, personality assessments, and cognitive ability tests. Results feed into ranking algorithm.",
    why: "Objective measurement of candidate skills.",
    pros: ["Standardized evaluation", "Reduces interviewer bias"],
    cons: ["Timed tests disadvantage some groups", "May not reflect real job performance"],
    alternatives: [{ name: "Portfolio review", reason: "Better for creative roles" }],
    x: 660,
    y: 200,
  },
  {
    id: "ai-interview",
    name: "Video Interview Analyzer",
    kind: "ai",
    description: "AI system that analyzes recorded video interviews for communication skills, confidence, and cultural fit. Uses facial recognition and speech analysis.",
    why: "Scales interview screening beyond HR capacity.",
    pros: ["Consistent evaluation", "Processes many interviews quickly"],
    cons: ["Facial recognition bias concerns", "Accent/speech pattern bias", "Privacy issues"],
    alternatives: [{ name: "Human-only interviews", reason: "More empathetic but resource-intensive" }],
    x: 660,
    y: 320,
  },
  {
    id: "db-candidates",
    name: "Candidate Database",
    kind: "database",
    description: "Stores candidate profiles, resumes, assessment results, interview recordings, and AI-generated scores. Retains data for 2 years for compliance.",
    why: "Central repository for all candidate information.",
    pros: ["Searchable talent pool", "Historical data for AI training"],
    cons: ["Privacy concerns", "Data retention policies vary by region"],
    alternatives: [{ name: "Distributed storage", reason: "Better for multi-region compliance" }],
    x: 940,
    y: 200,
  },
  {
    id: "be-ranking",
    name: "Candidate Ranking Service",
    kind: "backend",
    description: "Aggregates scores from resume screening, assessments, and interviews to produce a final candidate ranking. Weights configured by HR for each job posting.",
    why: "Synthesizes multiple signals into actionable hiring recommendations.",
    pros: ["Data-driven decisions", "Configurable weights"],
    cons: ["Black-box rankings may be hard to explain", "Amplifies upstream biases"],
    alternatives: [{ name: "Simple scoring", reason: "More transparent but less sophisticated" }],
    x: 940,
    y: 80,
  },
  {
    id: "be-notifications",
    name: "Notification Service",
    kind: "backend",
    description: "Sends automated emails and SMS to candidates about application status, interview schedules, and decisions. Templates in English only.",
    why: "Keeps candidates informed throughout the process.",
    pros: ["Automated updates", "Reduces HR communication burden"],
    cons: ["English-only templates", "May go to spam", "Requires valid phone for SMS"],
    alternatives: [{ name: "In-app notifications", reason: "More reliable delivery" }],
    x: 940,
    y: 320,
  },
];

/**
 * System document describing the hiring platform
 */
export const MOCK_HIRING_SYSTEM_DOCUMENT = `
# TalentAI - Automated Hiring Platform

## System Overview
TalentAI is an AI-powered recruitment platform designed to streamline the hiring process for enterprise clients. The system automates resume screening, candidate assessment, and interview analysis to help HR teams make faster, data-driven hiring decisions.

## Key Features
1. **Automated Resume Parsing**: AI extracts skills, experience, and education from uploaded resumes (PDF, DOC, DOCX formats supported)
2. **Skill Assessments**: Timed online tests for technical skills, cognitive ability, and personality traits
3. **Video Interview Analysis**: AI analyzes recorded responses for communication skills and cultural fit
4. **Candidate Ranking**: Machine learning algorithm ranks candidates based on weighted criteria
5. **HR Dashboard**: Comprehensive interface for managing the hiring pipeline

## User Requirements
- Valid email address for account creation
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection for video interviews
- Webcam and microphone for video assessments
- Ability to complete timed assessments (typically 30-60 minutes)

## Data Handling
- Resumes stored for up to 2 years
- Video interviews retained for 6 months
- All data encrypted at rest and in transit
- GDPR compliance for EU candidates

## Current Limitations
- Interface available in English only
- Video interviews require minimum 5 Mbps connection
- Assessment platform not optimized for screen readers
- Phone number required for SMS notifications
`;
