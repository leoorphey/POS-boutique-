import { config } from "dotenv";
import path from "path";

// Charge d'abord la configuration réelle du projet, puis la surcouche .env.test si elle existe.
config({ path: path.resolve(__dirname, "../../.env") });
config({ path: path.resolve(__dirname, "../../.env.test") });

process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";
