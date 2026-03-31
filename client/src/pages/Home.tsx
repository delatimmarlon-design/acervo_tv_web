import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { VideoForm } from "@/components/VideoForm";
import { VideoTable } from "@/components/VideoTable";
import { FilterPanel } from "@/components/FilterPanel";
import { toast } from "sonner";
import type { Video } from "../../../drizzle/schema";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

declare global {
  interface jsPDF {
    autoTable?: any;
  }
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [filters, setFilters] = useState({
    programName: "",
    channel: "",
    programType: "",
    hdNumber: "",
    dateFrom: "",
    dateTo: "",
  });

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Search query
  const { data: searchResults, isLoading } = trpc.video.search.useQuery({
    programName: filters.programName || undefined,
    channel: filters.channel || undefined,
    programType: (filters.programType as any) || undefined,
    hdNumber: filters.hdNumber ? parseInt(filters.hdNumber) : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page: currentPage,
    limit: 50,
    sortBy: (sortBy as any) || "createdAt",
    sortOrder,
  });

  // Export query
  const { data: exportData } = trpc.video.getAllForExport.useQuery({
    programName: filters.programName || undefined,
    channel: filters.channel || undefined,
    programType: (filters.programType as any) || undefined,
    hdNumber: filters.hdNumber ? parseInt(filters.hdNumber) : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    sortBy: (sortBy as any) || "createdAt",
    sortOrder,
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      programName: "",
      channel: "",
      programType: "",
      hdNumber: "",
      dateFrom: "",
      dateTo: "",
    });
    setCurrentPage(1);
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingVideo(undefined);
  };

  const handleExportPDF = () => {
    if (!exportData || exportData.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const tableData = exportData.map((video) => [
        video.programName,
        video.broadcastDate,
        video.channel,
        video.hdNumber.toString(),
        video.programType,
      ]);

      (doc as any).autoTable({
        head: [["Nome do Programa", "Data de Exibição", "Canal", "HD", "Tipo"]],
        body: tableData,
        startY: 10,
        margin: 10,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 133, 244],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [242, 242, 242],
        },
      });

      const fileName = `acervo-tv-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      toast.success("PDF exportado com sucesso");
    } catch (error) {
      toast.error("Erro ao exportar PDF");
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Acervo TV</h1>
          <p className="text-lg text-gray-600 mb-8">Catálogo de Conteúdo Televisivo</p>
          <p className="text-gray-500">Por favor, faça login para continuar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Acervo TV</h1>
            <p className="text-muted-foreground">Catálogo de Conteúdo Televisivo</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Vídeo
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        <FilterPanel
          programName={filters.programName}
          channel={filters.channel}
          programType={filters.programType}
          hdNumber={filters.hdNumber}
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onProgramNameChange={(value) => setFilters({ ...filters, programName: value })}
          onChannelChange={(value) => setFilters({ ...filters, channel: value })}
          onProgramTypeChange={(value) => setFilters({ ...filters, programType: value })}
          onHdNumberChange={(value) => setFilters({ ...filters, hdNumber: value })}
          onDateFromChange={(value) => setFilters({ ...filters, dateFrom: value })}
          onDateToChange={(value) => setFilters({ ...filters, dateTo: value })}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          isLoading={isLoading}
        />

        {/* Results Info */}
        {searchResults && (
          <div className="text-sm text-muted-foreground">
            Mostrando {searchResults.data.length} de {searchResults.total} registros
            {searchResults.pages > 1 && ` (Página ${searchResults.page} de ${searchResults.pages})`}
          </div>
        )}

        {/* Video Table */}
        <VideoTable
          videos={searchResults?.data || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        {/* Pagination */}
        {searchResults && searchResults.pages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              Anterior
            </Button>
            {Array.from({ length: searchResults.pages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                disabled={isLoading}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(searchResults.pages, currentPage + 1))}
              disabled={currentPage === searchResults.pages || isLoading}
            >
              Próximo
            </Button>
          </div>
        )}
      </div>

      {/* Video Form Modal */}
      <VideoForm
        open={formOpen}
        onOpenChange={handleFormClose}
        video={editingVideo}
        onSuccess={() => {
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
