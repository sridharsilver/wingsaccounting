import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2, MessageCircle, Mail, CheckCircle, Calendar, User, FileText, Phone, MessageSquare, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusPill } from "@/components/admin/StatusPill";
import { supabase } from "@/lib/supabase";
import { AdminCard } from "@/components/admin/AdminCard";
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/enquiries")({ 
  component: EnquiriesPage 
});

function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const permissions = await LocalNotifications.checkPermissions();
        if (permissions.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } catch (err) {
        console.error("Local notifications not supported or error requesting permissions", err);
      }
    };
    initNotifications();

    fetchEnquiries();

    const channel = supabase
      .channel('public:enquiries_list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'enquiries' },
        (payload) => {
          console.log("New enquiry received:", payload);
          
          // Trigger Local Notification
          LocalNotifications.schedule({
            notifications: [
              {
                title: "New Enquiry Received!",
                body: `${payload.new.full_name} is interested in ${payload.new.service_type || 'your services'}`,
                id: Date.now(),
                schedule: { at: new Date(Date.now() + 1000) },
                sound: 'default',
              }
            ]
          }).catch(err => console.error("Error scheduling notification", err));

          fetchEnquiries();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'enquiries' },
        () => fetchEnquiries()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'enquiries' },
        () => fetchEnquiries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchEnquiries() {
    setLoading(true);
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setEnquiries(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deletingId) return;
    const { error } = await supabase.from("enquiries").delete().eq("id", deletingId);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
    } else {
      toast.success("Enquiry deleted");
    }
    setDeletingId(null);
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "new" ? "replied" : "new";
    const { error } = await supabase.from("enquiries").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error(`Failed to update status: ${error.message}`);
    } else {
      toast.success(`Marked as ${newStatus}`);
    }
  }

  const columns = ["Name", "Email", "Subject", "Message", "Status", "Date", "Actions"];
  const renderRows = (data: any[]) => data.map((e) => [
    <div className="font-medium" key={e.id}>{e.name}</div>,
    e.email,
    e.subject,
    <div key={`m-${e.id}`} className="max-w-[200px] xl:max-w-[300px] truncate text-muted-foreground text-sm" title={e.message}>
      {e.message}
    </div>,
    <StatusPill key={`s-${e.id}`} tone={e.status === "new" ? "amber" : "green"}>
      {e.status}
    </StatusPill>,
    new Date(e.created_at).toLocaleDateString(),
    <div className="flex gap-1" key={`a-${e.id}`} onClick={(ev) => ev.stopPropagation()}>
      {e.phone && (
        <a 
          href={`https://wa.me/${e.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${e.name.split(' ')[0]}, we received your enquiry about "${e.subject || 'our services'}" at Wings Graphics. How can we assist you today?`)}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          title="Chat on WhatsApp"
        >
          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10">
            <MessageCircle size={14} />
          </Button>
        </a>
      )}
      {e.email && (
        <a href={`mailto:${e.email}?subject=Re: ${encodeURIComponent(e.subject || 'Your Enquiry')}`} title="Send Email">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
            <Mail size={14} />
          </Button>
        </a>
      )}
      <Button 
        variant="ghost" 
        size="icon" 
        className={`h-8 w-8 ${e.status === 'new' ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-500/10' : 'text-gray-400'}`} 
        onClick={() => handleToggleStatus(e.id, e.status)}
        title={e.status === 'new' ? "Mark as Replied" : "Mark as New"}
      >
        <CheckCircle size={14} />
      </Button>
    </div>
  ]);

  const newEnquiries = enquiries.filter(e => e.status === 'new');
  const repliedEnquiries = enquiries.filter(e => e.status === 'replied');

  const EnquiryGrid = ({ data }: { data: any[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {data.map((e) => (
        <AdminCard 
          key={e.id} 
          className="group overflow-hidden flex flex-col h-full border border-white/5 hover:border-brand/30 transition-all duration-300 cursor-pointer"
          onClick={() => setSelectedEnquiry(e)}
        >
          <div className="p-6 flex-1 flex flex-col bg-gradient-to-br from-white/[0.03] to-transparent relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col">
                <h3 className="font-bold text-lg leading-tight">{e.name}</h3>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium truncate max-w-[150px]">{e.email}</div>
              </div>
              <StatusPill tone={e.status === "new" ? "amber" : "green"}>
                {e.status}
              </StatusPill>
            </div>
            <div className="text-xs font-bold text-brand mb-2 truncate uppercase tracking-tighter">{e.subject || "No Subject"}</div>
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-6 flex-1">"{e.message}"</p>
            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="text-[10px] text-muted-foreground uppercase">{new Date(e.created_at).toLocaleDateString()}</div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {e.phone && <MessageCircle size={14} className="text-green-500" />}
                <Mail size={14} className="text-blue-500" />
              </div>
            </div>
          </div>
        </AdminCard>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader 
        title="Enquiries" 
        desc="Inbound leads from your contact form." 
        action={
          <div className="flex items-center justify-end w-full sm:w-auto">
            <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-brand shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-brand shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={16} />
            </Button>
            </div>
          </div>
        }
      />
      
      <Tabs defaultValue="new" className="mt-4">
        <TabsList className="bg-foreground/5 border-white/5 p-1 mb-4 h-12">
          <TabsTrigger value="new" className="rounded-md gap-2 px-6 h-10 data-[state=active]:bg-background data-[state=active]:shadow-elegant">
            New Enquiries
            {newEnquiries.length > 0 && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 border-amber-500/20 px-1.5 h-5 min-w-5 justify-center">
                {newEnquiries.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="replied" className="rounded-md px-6 h-10 data-[state=active]:bg-background data-[state=active]:shadow-elegant">
            Replied
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-0 outline-none">
          {loading ? (
            <div className="h-64 grid place-items-center">
              <div className="size-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : viewMode === "list" ? (
            <DataTable 
              columns={columns} 
              rows={renderRows(newEnquiries)} 
              onRowClick={(idx) => setSelectedEnquiry(newEnquiries[idx])} 
            />
          ) : (
            <EnquiryGrid data={newEnquiries} />
          )}
          {!loading && newEnquiries.length === 0 && (
            <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10 mt-4">
              <p className="text-muted-foreground">All caught up! No new enquiries.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="replied" className="mt-0 outline-none">
          {loading ? (
            <div className="h-64 grid place-items-center">
              <div className="size-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : viewMode === "list" ? (
            <DataTable 
              columns={columns} 
              rows={renderRows(repliedEnquiries)} 
              onRowClick={(idx) => setSelectedEnquiry(repliedEnquiries[idx])} 
            />
          ) : (
            <EnquiryGrid data={repliedEnquiries} />
          )}
          {!loading && repliedEnquiries.length === 0 && (
            <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10 mt-4">
              <p className="text-muted-foreground">No replied enquiries yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent className="glass border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Enquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the message from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-white/5 border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-glow" 
              onClick={handleDelete}
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedEnquiry} onOpenChange={(v) => !v && setSelectedEnquiry(null)}>
        <DialogContent className="glass border-white/10 max-w-2xl">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="text-brand size-5" />
              Enquiry Details
            </DialogTitle>
            <DialogDescription>
              Received on {selectedEnquiry && new Date(selectedEnquiry.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedEnquiry && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <User size={12} /> Sender Name
                  </div>
                  <div className="text-sm font-medium">{selectedEnquiry.name}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Mail size={12} /> Email Address
                  </div>
                  <a href={`mailto:${selectedEnquiry.email}`} className="text-sm text-brand hover:underline">{selectedEnquiry.email}</a>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Phone size={12} /> Phone Number
                  </div>
                  <div className="text-sm">{selectedEnquiry.phone || "Not provided"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <FileText size={12} /> Subject
                  </div>
                  <div className="text-sm font-medium text-brand">{selectedEnquiry.subject || "No Subject"}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <MessageSquare size={12} /> Full Message
                </div>
                <div className="bg-foreground/5 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap border border-white/5">
                  {selectedEnquiry.message}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {selectedEnquiry.phone && (
                  <a 
                    href={`https://wa.me/${selectedEnquiry.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedEnquiry.name.split(' ')[0]}, we received your enquiry about "${selectedEnquiry.subject || 'our services'}" at Wings Graphics...`)}`} 
                    target="_blank" 
                    rel="noopener"
                    className="flex-1"
                  >
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white gap-2 shadow-lg shadow-green-500/20">
                      <MessageCircle size={16} /> Reply on WhatsApp
                    </Button>
                  </a>
                )}
                <a href={`mailto:${selectedEnquiry.email}`} className="flex-1">
                  <Button variant="outline" className="w-full gap-2 border-white/10 hover:bg-white/5">
                    <Mail size={16} /> Reply via Email
                  </Button>
                </a>
                <Button 
                  variant="ghost" 
                  className="w-full mt-2 text-destructive hover:text-red-600 hover:bg-red-500/10 gap-2 border border-destructive/10"
                  onClick={() => {
                    setDeletingId(selectedEnquiry.id);
                    setSelectedEnquiry(null); // Close the detail dialog
                  }}
                >
                  <Trash2 size={16} /> Delete Enquiry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
