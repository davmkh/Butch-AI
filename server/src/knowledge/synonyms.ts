/**
 * Words students use interchangeably. If an entry's title or keywords contain
 * any word in a group, the entry also matches every other word in that group,
 * so "Is the gym open?" finds the Rec Center and "where can I grab grub" finds
 * dining without listing every slang word on every entry.
 *
 * Keep each group to true synonyms. A word that also means something else in
 * the knowledge base (like "pass" in "pass/fail") will drag in wrong answers.
 * Single words only; they go through the same stemming as questions.
 */
export const SYNONYM_GROUPS: string[][] = [
  // Food and dining
  ['food', 'eat', 'eating', 'dining', 'dine', 'meal', 'hungry', 'grub', 'chow', 'cafeteria', 'caf'],
  ['coffee', 'espresso', 'latte', 'caffeine'],
  // Recreation
  ['gym', 'rec', 'recreation', 'workout', 'fitness', 'exercise', 'lift', 'lifting', 'src', 'urec'],
  ['pool', 'swim', 'swimming', 'aquatics'],
  // Academics
  ['class', 'course'],
  ['exam', 'finals', 'test'],
  ['library', 'libraries', 'lib'],
  ['tutor', 'tutoring', 'homework'],
  ['research', 'researcher', 'researching'],
  ['grant', 'funding', 'stipend', 'scholarship'],
  // Life on campus
  ['dorm', 'housing', 'residence', 'res'],
  ['club', 'organization', 'org', 'rso'],
  ['party', 'fun', 'social'],
  ['doctor', 'clinic', 'medical', 'sick', 'ill', 'nurse', 'physician'],
  ['counseling', 'counselor', 'therapy', 'therapist', 'mental', 'psychologist', 'overwhelmed'],
  ['anxiety', 'anxious', 'stress', 'stressed', 'depressed', 'depression'],
  ['career', 'job', 'internship', 'employment', 'resume'],
  // Sports
  ['sport', 'athletic', 'athletics', 'varsity'],
  ['ticket', 'seat'],
  ['basketball', 'hoops', 'bball'],
  ['football', 'gameday'],
  ['huskies', 'husky', 'uw', 'dawgs'],
];

/**
 * Words to swap before searching: student shorthand ("chem"), plus common
 * misspellings that are too far off for typo matching or that are real words
 * themselves ("brake" vs "break").
 */
export const WORD_FIXES: Record<string, string> = {
  // Shorthand
  bio: 'biology',
  chem: 'chemistry',
  calc: 'math',
  econ: 'economics',
  psych: 'psychology',
  stats: 'statistics',
  compsci: 'computer',
  cpts: 'computer',
  bball: 'basketball',
  vball: 'volleyball',
  prof: 'professor',
  profs: 'professor',
  // Misspellings
  brake: 'break',
  brakes: 'break',
  libary: 'library',
  lybrary: 'library',
  footbal: 'football',
  futbol: 'football',
  resturant: 'restaurant',
  schedual: 'schedule',
  shedule: 'schedule',
  registar: 'registrar',
  gradution: 'graduation',
  comencement: 'commencement',
  acadmic: 'academic',
  gim: 'gym',
  jym: 'gym',
};
