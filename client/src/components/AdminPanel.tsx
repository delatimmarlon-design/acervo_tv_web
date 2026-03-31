import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, Mail } from "lucide-react";

export default function AdminPanel() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState("viewer");
  const [isOpen, setIsOpen] = useState(false);

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.users.list.useQuery();
  const { data: invitations, isLoading: invitationsLoading, refetch: refetchInvitations } = trpc.admin.invitations.list.useQuery();

  const inviteUserMutation = trpc.admin.users.invite.useMutation({
    onSuccess: (data) => {
      toast.success(`Convite enviado para ${inviteEmail}`);
      setInviteEmail("");
      setInvitePermission("viewer");
      setIsOpen(false);
      refetchInvitations();
      
      // Copy invite link to clipboard
      if (data?.token) {
        const inviteLink = `${window.location.origin}/invite/${data.token}`;
        navigator.clipboard.writeText(inviteLink);
        toast.info("Link de convite copiado para a área de transferência");
      }
    },
    onError: (error) => {
      toast.error(`Erro ao enviar convite: ${error.message}`);
    },
  });

  const removeUserMutation = trpc.admin.users.remove.useMutation({
    onSuccess: () => {
      toast.success("Usuário removido com sucesso");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Erro ao remover usuário: ${error.message}`);
    },
  });

  const updatePermissionMutation = trpc.admin.users.updatePermission.useMutation({
    onSuccess: () => {
      toast.success("Permissão atualizada com sucesso");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar permissão: ${error.message}`);
    },
  });

  const handleInviteUser = () => {
    if (!inviteEmail) {
      toast.error("Por favor, insira um email");
      return;
    }
    inviteUserMutation.mutate({ email: inviteEmail, permissionLevel: invitePermission as "viewer" | "editor" | "admin" });
  };

  const handleRemoveUser = (permissionId: number) => {
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      removeUserMutation.mutate({ permissionId });
    }
  };

  const getPermissionLabel = (level: string) => {
    const labels: Record<string, string> = {
      viewer: "Visualizador",
      editor: "Editor",
      admin: "Administrador",
    };
    return labels[level] || level;
  };

  return (
    <div className="space-y-6">
      {/* Invite Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Convidar Usuário
          </CardTitle>
          <CardDescription>Convide colaboradores para acessar seu catálogo</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Convite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Usuário</DialogTitle>
                <DialogDescription>Envie um convite para um novo usuário acessar seu catálogo</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nível de Permissão</label>
                  <Select value={invitePermission} onValueChange={setInvitePermission}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Visualizador (apenas leitura)</SelectItem>
                      <SelectItem value="editor">Editor (criar, editar, deletar)</SelectItem>
                      <SelectItem value="admin">Administrador (gerenciar usuários)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInviteUser} disabled={inviteUserMutation.isPending} className="w-full">
                  {inviteUserMutation.isPending ? "Enviando..." : "Enviar Convite"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Autorizados</CardTitle>
          <CardDescription>{users?.length || 0} usuário(s) com acesso</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando usuários...</div>
          ) : users && users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">ID: {user.userId}</p>
                    <p className="text-sm text-gray-600">{getPermissionLabel(user.permissionLevel)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Select value={user.permissionLevel} onValueChange={(value) => {
                      updatePermissionMutation.mutate({ permissionId: user.id, permissionLevel: value as "viewer" | "editor" | "admin" });
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={removeUserMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Nenhum usuário autorizado ainda</div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Convites Pendentes</CardTitle>
          <CardDescription>{invitations?.filter(i => !i.acceptedAt).length || 0} convite(s) aguardando resposta</CardDescription>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando convites...</div>
          ) : invitations && invitations.filter(i => !i.acceptedAt).length > 0 ? (
            <div className="space-y-3">
              {invitations.filter(i => !i.acceptedAt).map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{invitation.invitedEmail}</p>
                    <p className="text-sm text-gray-600">{getPermissionLabel(invitation.permissionLevel)} • Expira em {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Nenhum convite pendente</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
