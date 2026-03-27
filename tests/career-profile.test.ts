import test from 'node:test';
import assert from 'node:assert/strict';
import { areCareerProfilesEqual } from '../src/lib/dashboard/careerProfile.js';
import type { CareerProfileState } from '../src/types/dashboard/careerProfile.js';

const createCareerProfile = (): CareerProfileState => ({
  full_name: 'Alex Morgan',
  headline: 'Product Designer',
  location: 'Lagos, NG',
  email: 'alex@example.com',
  phone: '+2348000000000',
  website: 'https://example.com',
  bio: 'Designs thoughtful product experiences.',
  experience: [
    {
      id: 'exp-1',
      role: 'Designer',
      company: 'ResumeNow',
      startDate: '2024-01',
      endDate: 'Present',
      description: 'Led redesigns and prototypes.',
    },
  ],
  education: [
    {
      id: 'edu-1',
      school: 'University of Lagos',
      degree: 'BSc Computer Science',
      startDate: '2018-01',
      endDate: '2022-01',
      description: 'Graduated with honors.',
    },
  ],
  skills: ['Figma', 'Research', 'Prototyping'],
});

test('areCareerProfilesEqual returns true for identical scalar and nested values', () => {
  const left = createCareerProfile();
  const right = createCareerProfile();

  assert.equal(areCareerProfilesEqual(left, right), true);
});

test('areCareerProfilesEqual detects nested experience changes', () => {
  const left = createCareerProfile();
  const right = createCareerProfile();
  right.experience[0] = {
    ...right.experience[0],
    description: 'Led redesigns, prototypes, and usability testing.',
  };

  assert.equal(areCareerProfilesEqual(left, right), false);
});

test('areCareerProfilesEqual treats skill order as meaningful draft state', () => {
  const left = createCareerProfile();
  const right = createCareerProfile();
  right.skills = ['Research', 'Figma', 'Prototyping'];

  assert.equal(areCareerProfilesEqual(left, right), false);
});
