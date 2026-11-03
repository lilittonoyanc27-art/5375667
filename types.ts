export type QuestionStatus = 'unanswered' | 'active' | 'correct' | 'incorrect' | 'passed';

export interface QuestionData {
  id: number;
  letter: string;
  part: number;
  partTitleEs: string;
  partTitleAm: string;
  questionEs: string;
  questionAm: string;
  answerEs: string;
  answerAm: string;
  keywords: string[];
}

export type GameMode = 'rosco' | 'practice' | 'review';
