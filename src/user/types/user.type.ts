export type UserType = {
  name?: string;
  email?: string;
  password?: string;
  token?: string;
};

export interface ErrorType {
  message: string;
  type: string;
}

export interface UserSignUpType {
  message: string;
  status: string;
}
