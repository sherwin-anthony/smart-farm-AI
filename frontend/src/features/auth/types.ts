// Purpose: shared auth-related frontend types.

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type RegisterPayload = {
  owner_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  farm_name: string;
  location: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UpdateUserPayload = {
  name: string;
  email: string;
};
