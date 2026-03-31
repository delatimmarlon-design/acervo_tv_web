import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface FilterPanelProps {
  programName: string;
  channel: string;
  programType: string;
  hdNumber: string;
  dateFrom: string;
  dateTo: string;
  onProgramNameChange: (value: string) => void;
  onChannelChange: (value: string) => void;
  onProgramTypeChange: (value: string) => void;
  onHdNumberChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  isLoading: boolean;
}

export function FilterPanel({
  programName,
  channel,
  programType,
  hdNumber,
  dateFrom,
  dateTo,
  onProgramNameChange,
  onChannelChange,
  onProgramTypeChange,
  onHdNumberChange,
  onDateFromChange,
  onDateToChange,
  onSearch,
  onClear,
  isLoading,
}: FilterPanelProps) {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-lg">Filtros</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="programName">Nome do Programa</Label>
          <Input
            id="programName"
            placeholder="Buscar por nome..."
            value={programName}
            onChange={(e) => onProgramNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="channel">Canal</Label>
          <Input
            id="channel"
            placeholder="Ex: Globo, SBT"
            value={channel}
            onChange={(e) => onChannelChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="programType">Tipo de Programa</Label>
          <Select value={programType} onValueChange={onProgramTypeChange}>
            <SelectTrigger id="programType">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Telejornal">Telejornal</SelectItem>
              <SelectItem value="Novela">Novela</SelectItem>
              <SelectItem value="Série">Série</SelectItem>
              <SelectItem value="Variedade">Variedade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hdNumber">Número do HD</Label>
          <Input
            id="hdNumber"
            type="number"
            placeholder="Ex: 1, 2, 3"
            value={hdNumber}
            onChange={(e) => onHdNumberChange(e.target.value)}
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateFrom">Data De (dd/mm/aaaa)</Label>
          <Input
            id="dateFrom"
            placeholder="01/01/2020"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            maxLength={10}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateTo">Data Até (dd/mm/aaaa)</Label>
          <Input
            id="dateTo"
            placeholder="31/12/2024"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            maxLength={10}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={onClear}
          disabled={isLoading}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          Limpar
        </Button>
        <Button
          onClick={onSearch}
          disabled={isLoading}
          className="gap-2"
        >
          <Search className="w-4 h-4" />
          Buscar
        </Button>
      </div>
    </div>
  );
}
