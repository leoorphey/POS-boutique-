import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, ShoppingBag, Package, AlertTriangle } from "lucide-react";
import { StatCard } from "@/features/dashboard/StatCard";
import {
  useDashboardOverview,
  useSalesByDay,
  useTopProducts,
  useTopCategories,
} from "@/features/dashboard/dashboard.hooks";

function formatFcfa(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export function DashboardPage() {
  const { data: overview, isLoading } = useDashboardOverview();
  const { data: salesByDay } = useSalesByDay();
  const { data: topProducts } = useTopProducts();
  const { data: topCategories } = useTopCategories();

  if (isLoading || !overview) {
    return <div className="p-8 text-sm text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Aujourd'hui</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Ventes"
            value={String(overview.today.nombreVentes)}
            icon={ShoppingBag}
          />
          <StatCard
            label="Chiffre d'affaires"
            value={formatFcfa(overview.today.chiffreAffaires)}
            icon={TrendingUp}
          />
          <StatCard
            label="Produits vendus"
            value={String(overview.today.produitsVendus)}
            icon={Package}
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Ce mois-ci</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Ventes"
            value={String(overview.monthly.nombreVentes)}
            icon={ShoppingBag}
          />
          <StatCard
            label="Chiffre d'affaires"
            value={formatFcfa(overview.monthly.chiffreAffaires)}
            icon={TrendingUp}
          />
          <StatCard
            label="Panier moyen"
            value={formatFcfa(overview.monthly.panierMoyen)}
            icon={Package}
          />
        </div>
      </div>

      {overview.stock.lowStockProducts.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium text-sm">
              {overview.stock.lowStockProducts.length} produit(s) en stock faible
            </span>
          </div>
          <ul className="text-sm text-amber-700 space-y-1">
            {overview.stock.lowStockProducts.slice(0, 5).map((p) => (
              <li key={p.id}>
                {p.marque} {p.nom} — {p.quantiteStock} restant(s)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-background p-4">
          <h3 className="text-sm font-medium mb-4">Ventes des 30 derniers jours</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatFcfa(value)} />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <h3 className="text-sm font-medium mb-4">Produits les plus vendus</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="nom" type="category" width={120} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="quantiteVendue" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border bg-background p-4 col-span-2">
          <h3 className="text-sm font-medium mb-4">Chiffre d'affaires par catégorie</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topCategories}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="categorie" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatFcfa(value)} />
              <Bar dataKey="chiffreAffaires" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
