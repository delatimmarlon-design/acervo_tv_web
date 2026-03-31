import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function Login() {
  const [masterPassword, setMasterPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const verifyMasterPassword = trpc.auth.verifyMasterPassword.useMutation();

  const handleMasterPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword) {
      toast.error("Por favor, digite a senha mestre");
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyMasterPassword.mutateAsync({ password: masterPassword });
      if (result.success) {
        // Store session and redirect to home
        toast.success("Acesso concedido!");
        // Redirect to home after successful login
        window.location.href = "/";
      }
    } catch (error: any) {
      toast.error(error.message || "Senha mestre incorreta");
      setMasterPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Acervo TV</h1>
            <p className="text-gray-600">Catálogo de Conteúdo Televisivo</p>
          </div>

          <div className="space-y-6">
            {/* Master Password Login */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h2>
              <form onSubmit={handleMasterPasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Mestre
                  </label>
                  <Input
                    type="password"
                    placeholder="Digite sua senha mestre"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Verificando..." : "Entrar com Senha Mestre"}
                </Button>
              </form>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* OAuth Login */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Login com Manus</h2>
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                variant="outline"
                className="w-full"
              >
                Fazer Login com Manus OAuth
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-8">
            Seu acervo está seguro e protegido com autenticação de dois níveis
          </p>
        </div>
      </Card>
    </div>
  );
}
