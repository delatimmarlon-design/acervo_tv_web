import { useAuth } from "@/_core/hooks/useAuth";
import AdminPanel from "@/components/AdminPanel";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Admin() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Catálogo
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Painel de Administração</h1>
            <p className="text-gray-600 mt-2">Gerencie usuários e permissões do seu catálogo</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Admin Panel */}
        <AdminPanel />
      </div>
    </div>
  );
}
