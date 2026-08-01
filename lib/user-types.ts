export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  createdAt: string;
  /** Granted by admin — shows Manager tab and match control tools */
  isManager?: boolean;
}

export interface UserSettings {
  notifications: boolean;
  oddsFormat: "decimal" | "fractional";
  language: string;
}

export interface StoredUser extends User {
  password: string;
  settings: UserSettings;
}

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: true,
  oddsFormat: "decimal",
  language: "en",
};
