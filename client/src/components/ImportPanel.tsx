import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ParsedFile {
  programName: string;
  broadcastDate: string;
  fileName: string;
}

function parseVideoFilename(fileName: string): ParsedFile | null {
  // Pattern: "PROGRAM_NAME DD-MM-YYYY.mp4"
  const pattern = /^(.+?)\s+(\d{2})-(\d{2})-(\d{4})\.mp4$/i;
  const match = fileName.match(pattern);

  if (!match) {
    return null;
  }

  const [, programName, day, month, year] = match;
  const broadcastDate = `${day}/${month}/${year}`;

  return {
    programName: programName.trim(),
    broadcastDate,
    fileName,
  };
}

interface ImportPanelProps {
  onImportComplete?: () => void;
}

export default function ImportPanel({ onImportComplete }: ImportPanelProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [hdNumber, setHdNumber] = useState("");
  const [channel, setChannel] = useState("");
  const [programType, setProgramType] = useState("Telejornal");
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);

  const createVideoMutation = trpc.video.create.useMutation();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;

    const mp4Files = Array.from(files).filter((file) => file.name.endsWith(".mp4"));

    if (mp4Files.length === 0) {
      toast.error("Nenhum arquivo .mp4 foi selecionado");
      return;
    }

    const parsed: ParsedFile[] = [];
    const errors: string[] = [];

    mp4Files.forEach((file) => {
      const result = parseVideoFilename(file.name);
      if (result) {
        parsed.push(result);
      } else {
        errors.push(file.name);
      }
    });

    if (errors.length > 0) {
      toast.error(
        `${errors.length} arquivo(s) não seguem o padrão: PROGRAMA DD-MM-YYYY.mp4`
      );
    }

    if (parsed.length > 0) {
      setParsedFiles(parsed);
      toast.success(`${parsed.length} arquivo(s) pronto(s) para importar`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleImport = async () => {
    if (!hdNumber || !channel) {
      toast.error("Por favor, preencha o número do HD e o canal");
      return;
    }

    if (parsedFiles.length === 0) {
      toast.error("Nenhum arquivo para importar");
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of parsedFiles) {
      try {
        await createVideoMutation.mutateAsync({
          programName: file.programName,
          broadcastDate: file.broadcastDate,
          channel,
          hdNumber: parseInt(hdNumber),
          programType: programType as "Telejornal" | "Novela" | "Série" | "Variedade",
        });
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Erro ao importar ${file.fileName}:`, error);
      }
    }

    setIsImporting(false);

    if (successCount > 0) {
      toast.success(`${successCount} vídeo(s) importado(s) com sucesso`);
      setParsedFiles([]);
      setHdNumber("");
      setChannel("");
      onImportComplete?.();
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} vídeo(s) falharam na importação`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Importar Vídeos
        </CardTitle>
        <CardDescription>
          Arraste arquivos .mp4 ou clique para selecionar. Formato: PROGRAMA DD-MM-YYYY.mp4
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400"
          }`}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            Arraste arquivos .mp4 aqui ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Formato esperado: PROGRAMA DD-MM-YYYY.mp4
          </p>
          <input
            type="file"
            multiple
            accept=".mp4"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            Selecionar Arquivos
          </Button>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Número do HD</label>
            <Input
              type="number"
              placeholder="Ex: 1"
              value={hdNumber}
              onChange={(e) => setHdNumber(e.target.value)}
              min="1"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Canal</label>
            <Input
              placeholder="Ex: Globo"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tipo de Programa</label>
            <select
              value={programType}
              onChange={(e) => setProgramType(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="Telejornal">Telejornal</option>
              <option value="Novela">Novela</option>
              <option value="Série">Série</option>
              <option value="Variedade">Variedade</option>
            </select>
          </div>
        </div>

        {/* Parsed Files List */}
        {parsedFiles.length > 0 && (
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-sm">
                {parsedFiles.length} arquivo(s) pronto(s) para importar
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {parsedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-white p-2 rounded border border-blue-200"
                >
                  <p className="font-medium">{file.programName}</p>
                  <p className="text-gray-600">
                    Data: {file.broadcastDate} | Arquivo: {file.fileName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {parsedFiles.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Selecione arquivos .mp4 para começar</span>
          </div>
        )}

        {/* Missing Fields Alert */}
        {parsedFiles.length > 0 && (!hdNumber || !channel) && (
          <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Campos obrigatorios faltando:</p>
              <ul className="text-xs mt-1 space-y-1">
                {!hdNumber && <li>• Numero do HD</li>}
                {!channel && <li>• Canal</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Import Button */}
        <Button
          onClick={handleImport}
          disabled={parsedFiles.length === 0 || !hdNumber || !channel || isImporting}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Importar {parsedFiles.length > 0 ? `${parsedFiles.length} Vídeo(s)` : "Vídeos"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
