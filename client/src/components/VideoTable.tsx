import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Edit2, ChevronUp, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { Video } from "../../../drizzle/schema";

interface VideoTableProps {
  videos: Video[];
  isLoading: boolean;
  onEdit: (video: Video) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
}

export function VideoTable({ videos, isLoading, onEdit, sortBy, sortOrder, onSort }: VideoTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteMutation = trpc.video.delete.useMutation();
  const utils = trpc.useUtils();

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Vídeo deletado com sucesso");
      await utils.video.search.invalidate();
      setDeleteId(null);
    } catch (error) {
      toast.error("Erro ao deletar vídeo");
      console.error(error);
    }
  };

  const SortHeader = ({ column, label }: { column: string; label: string }) => (
    <TableHead className="cursor-pointer hover:bg-muted" onClick={() => onSort(column)}>
      <div className="flex items-center gap-2">
        {label}
        {sortBy === column && (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
      </div>
    </TableHead>
  );

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader column="programName" label="Nome do Programa" />
              <SortHeader column="broadcastDate" label="Data de Exibição" />
              <SortHeader column="channel" label="Canal" />
              <TableHead>HD</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : videos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum vídeo encontrado
                </TableCell>
              </TableRow>
            ) : (
              videos.map((video) => (
                <TableRow key={video.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{video.programName}</TableCell>
                  <TableCell>{video.broadcastDate}</TableCell>
                  <TableCell>{video.channel}</TableCell>
                  <TableCell>{video.hdNumber}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                      {video.programType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(video)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(video.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este vídeo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Deletar
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
