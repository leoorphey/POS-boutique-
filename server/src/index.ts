import { createApp } from "@/app";
import { env } from "@/config/env";
import { prisma } from "@/config/prisma";

async function main() {
  // Vérifie la connexion DB avant de démarrer le serveur HTTP,
  // pour échouer rapidement et clairement si la base est inaccessible.
  await prisma.$connect();
  console.log("✅ Connexion à la base de données établie");

  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${env.port} (${env.nodeEnv})`);
  });

  // Arrêt propre : ferme les connexions HTTP et Prisma avant de quitter.
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} reçu, arrêt en cours...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log("Serveur arrêté proprement.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("❌ Échec du démarrage du serveur :", err);
  process.exit(1);
});
