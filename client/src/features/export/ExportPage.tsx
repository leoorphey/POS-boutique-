import { useState } from "react";
import { CalendarDays, Clock3, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/client";
import { extractErrorMessage } from "@/types/api";
import { pushToast } from "@/hooks/use-toast";

const exportButtons = [
  { period: "daily", label: "Export journalier", icon: CalendarDays },
  { period: "weekly", label: "Export hebdomadaire", icon: Clock3 },
  { period: "monthly", label: "Export mensuel", icon: Calendar },
  { period: "yearly", label: "Export annuel", icon: Download },
] as const;

type ExportPeriod = (typeof exportButtons)[number]["period"];

export function ExportPage() {
  const [downloading, setDownloading] = useState<ExportPeriod | "">("");

  const handleExport = async (period: ExportPeriod) => {
    setDownloading(period);
    try {
      const response = await apiClient.get(`/export/sales.xlsx`, {
        params: { period },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ventes-${period}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      pushToast({ title: `Export ${period} généré`, variant: "success" });
    } catch (error) {
      pushToast({ title: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setDownloading("");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-2xl font-semibold">
          <Download className="h-6 w-6 text-primary" />
          Export des ventes
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Téléchargez un fichier Excel des ventes validées pour la période sélectionnée.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {exportButtons.map(({ period, label, icon: Icon }) => (
          <Button
            key={period}
            className="justify-start"
            variant="outline"
            disabled={Boolean(downloading)}
            onClick={() => handleExport(period)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
