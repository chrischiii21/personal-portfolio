export interface Profile {
  name: string;
  title: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  website: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface Education {
  degree: string;
  school: string;
  period: string;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  period: string;
  location: string;
  points: string[];
}

export interface Project {
  name: string;
  description: string;
  tech: string[];
  url: string;
  /** Shown as a badge on the card, e.g. "in progress". */
  status?: string;
}
