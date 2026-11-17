import { Profile } from '../types';
import rawProfiles from './profiles.json';

export const SEED_PROFILES: Profile[] = rawProfiles as Profile[];

export const CURRENT_USER: Profile = {
  id: "coy_user_demo",
  name: "You (Alex)",
  age: 21,
  photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
  bio: "Curious builder exploring campus and working on cool projects.",
  college: "IIT Delhi",
  city: "New Delhi",
  interests: ["Coding", "Coffee", "Indie Music", "Design"],
  department: "Computer Science",
  graduationYear: 2025,
};
