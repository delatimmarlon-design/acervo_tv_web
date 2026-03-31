import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { Video } from "../../../drizzle/schema";

interface VideoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video?: Video;
  onSuccess?: () => void;
}

export function VideoForm({ open, onOpenChange, video, onSuccess }: VideoFormProps) {
  const [formData, setFormData] = useState({
    programName: video?.programName || "",
    broadcastDate: video?.broadcastDate || "",
    channel: video?.channel || "",
    hdNumber: video?.hdNumber?.toString() || "",
    programType: video?.programType || ("Telejornal" as const),
  });

  const createMutation = trpc.video.create.useMutation();
  const updateMutation = trpc.video.update.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.programName || !formData.broadcastDate || !formData.channel || !formData.hdNumber) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    try {
      if (video?.id) {
        await updateMutation.mutateAsync({
          id: video.id,
          programName: formData.programName,
          broadcastDate: formData.broadcastDate,
          channel: formData.channel,
          hdNumber: parseInt(formData.hdNumber),
          programType: formData.programType,
        });
        toast.success("Vídeo atualizado com sucesso");
      } else {
        await createMutation.mutateAsync({
          programName: formData.programName,
          broadcastDate: formData.broadcastDate,
          channel: formData.channel,
          hdNumber: parseInt(formData.hdNumber),
          programType: formData.programType,
        });
        toast.success("Vídeo criado com sucesso");
      }

      await utils.video.search.invalidate();
      onOpenChange(false);
      setFormData({
        programName: "",
        broadcastDate: "",
        channel: "",
        hdNumber: "",
        programType: "Telejornal",
      });
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao salvar vídeo");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{video?.id ? "Editar Vídeo" : "Novo Vídeo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="programName">Nome do Programa *</Label>
            <Input
              id="programName"
              placeholder="Ex: JORNAL NACIONAL"
              value={formData.programName}
              onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcastDate">Data de Exibição (dd/mm/aaaa) *</Label>
            <Input
              id="broadcastDate"
              placeholder="30/11/2016"
              value={formData.broadcastDate}
              onChange={(e) => setFormData({ ...formData, broadcastDate: e.target.value })}
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel">Canal de Origem *</Label>
            <Input
              id="channel"
              placeholder="Ex: Globo, SBT, Band"
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hdNumber">Número do HD *</Label>
            <Input
              id="hdNumber"
              type="number"
              placeholder="Ex: 1, 2, 3"
              value={formData.hdNumber}
              onChange={(e) => setFormData({ ...formData, hdNumber: e.target.value })}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="programType">Tipo de Programa *</Label>
            <Select value={formData.programType} onValueChange={(value) => setFormData({ ...formData, programType: value as any })}>
              <SelectTrigger id="programType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Telejornal">Telejornal</SelectItem>
                <SelectItem value="Novela">Novela</SelectItem>
                <SelectItem value="Série">Série</SelectItem>
                <SelectItem value="Variedade">Variedade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {video?.id ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
