// Ces enums doivent rester synchronisés avec server/prisma/schema.prisma
// Ils sont dupliqués ici car le client ne peut pas importer le client Prisma directement.

export enum Role {
  ADMIN = "ADMIN",
  VENDEUR = "VENDEUR",
}

export enum PaymentMethod {
  PAYDUNYA = "PAYDUNYA",
  ESPECES = "ESPECES",
  NEGOCIE = "NEGOCIE",
}

export enum SaleStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum StockMovementType {
  ENTREE = "ENTREE",
  SORTIE = "SORTIE",
  AJUSTEMENT = "AJUSTEMENT",
}
