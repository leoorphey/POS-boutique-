import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

// Augmentation du type Express.Request pour accéder à req.user
// après passage par le middleware authenticate.
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
