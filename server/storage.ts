import { type UserProfile } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
}

export class MemStorage implements IStorage {
  private profiles: Map<string, UserProfile>;

  constructor() {
    this.profiles = new Map();
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    return this.profiles.get(userId);
  }

  async createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const newProfile: UserProfile = {
      user_id: profile.user_id || '',
      email: profile.email || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...profile
    } as UserProfile;
    this.profiles.set(newProfile.user_id, newProfile);
    return newProfile;
  }
}

export const storage = new MemStorage();
