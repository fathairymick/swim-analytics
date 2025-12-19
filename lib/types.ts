export type Stroke = 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'Individual Medley';
export type Course = 'SCM' | 'LCM';
export type Distance = 25 | 50 | 100 | 200 | 400 | 800 | 1500;

export interface SwimEvent {
  stroke: Stroke;
  distance: Distance;
  course: Course;
}

export interface SwimTime {
  id: string;
  date: string; // ISO date string
  timeMs: number; // Time in milliseconds
  formattedTime: string; // e.g., "1:02.45"
  event: SwimEvent;
  meetName?: string;
  isOfficial: boolean;
  notes?: string;
}

export interface Swimmer {
  id: string;
  name: string;
  ageGroup: string;
  sex: 'M' | 'F';
  memberNumber?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  enteredCompetitions?: string[]; // List of Competition IDs
  targetPercentage?: number;
  pin: string;
  color?: string;
  times: SwimTime[];
}

export interface Competition {
  id: string;
  name: string;
  qualifyingPeriod: {
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
  };
  ageAtDate: string; // YYYY-MM-DD
  requirements?: string;
  course?: 'SCM' | 'LCM';
  standards: TimeStandard;
}

// Structure: Sex -> AgeGroup -> EventKey -> TimeMs
export type TimeStandard = Record<string, Record<string, Record<string, number>>>;

export interface StandardSet {
  name: string;
  year: number;
  times: TimeStandard;
}

export interface QualifyingStandards {
  County: StandardSet;
  Regional: StandardSet;
  National: StandardSet;
}
