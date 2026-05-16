import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Building2, 
  CreditCard, 
  FileText, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Globe,
  Wallet
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { INDIAN_STATES } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'

export const Route = createFileRoute('/_app/settings')({
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    company_name: '',
    gstin: '',
    address: '',
    state: 'Tamil Nadu',
    state_code: '33',
    bank_details: {
      bank_name: '',
      account_no: '',
      ifsc: '',
      branch: ''
    },
    invoice_prefix: 'INV-',
  });
  const [addressParts, setAddressParts] = useState({
    line1: '',
    line2: '',
    city: '',
    country: 'India',
    pincode: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setSettings(data);
        if (data.address) {
          const parts = data.address.split(',').map((p: string) => p.trim());
          setAddressParts({
            line1: parts[0] || '',
            line2: parts[1] || '',
            city: parts[2] || '',
            country: parts[4] || 'India',
            pincode: parts[5] || ''
          });
        }
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fullAddress = `${addressParts.line1}, ${addressParts.line2}, ${addressParts.city}, ${settings.state}, ${addressParts.country} ${addressParts.pincode}`;
      
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          user_id: session.user.id,
          ...settings,
          address: fullAddress,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <PageHeader 
        title="Terminal Config" 
        subtitle="Configure your company profile and invoice preferences."
        icon={Building2}
        actions={
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 rounded-2xl bg-gradient-brand text-brand-foreground font-bold shadow-glow hover:brightness-110 transition flex items-center gap-2 active:scale-95 text-xs uppercase tracking-widest"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={16} />}
            Commit Changes
          </button>
        }
      />

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 bg-foreground/5 p-1 rounded-2xl border border-border">
          <TabsTrigger value="company" className="rounded-xl flex items-center gap-2">
            <Building2 size={16} /> Company
          </TabsTrigger>
          <TabsTrigger value="bank" className="rounded-xl flex items-center gap-2">
            <Wallet size={16} /> Bank
          </TabsTrigger>
          <TabsTrigger value="invoice" className="rounded-xl flex items-center gap-2">
            <FileText size={16} /> Invoice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card className="border-none shadow-xl bg-surface/50 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-foreground/5 border-b border-border">
              <CardTitle className="flex items-center gap-2"><Building2 className="text-brand" /> Company Details</CardTitle>
              <CardDescription>This information will appear on your invoices.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="h-12 rounded-xl border-border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input 
                    value={settings.gstin}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    className="h-12 rounded-xl border-border bg-background font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select 
                    value={settings.state} 
                    onValueChange={(val) => {
                      const stateObj = INDIAN_STATES.find(s => s.name === val);
                      setSettings({ 
                        ...settings, 
                        state: val, 
                        state_code: stateObj?.code || settings.state_code 
                      });
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-border bg-background">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(state => (
                        <SelectItem key={state.code} value={state.name}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>State Code</Label>
                  <Input 
                    value={settings.state_code}
                    readOnly
                    className="h-12 rounded-xl border-border bg-foreground/5 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">Mailing Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Address Line 1</Label>
                    <Input 
                      value={addressParts.line1}
                      onChange={(e) => setAddressParts({ ...addressParts, line1: e.target.value })}
                      placeholder="Door No, Building Name"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Area / Locality</Label>
                    <Input 
                      value={addressParts.line2}
                      onChange={(e) => setAddressParts({ ...addressParts, line2: e.target.value })}
                      placeholder="Street, Area"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">City / Town</Label>
                    <Input 
                      value={addressParts.city}
                      onChange={(e) => setAddressParts({ ...addressParts, city: e.target.value })}
                      placeholder="City Name"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Country</Label>
                    <Input 
                      value={addressParts.country}
                      onChange={(e) => setAddressParts({ ...addressParts, country: e.target.value })}
                      className="h-11 rounded-xl bg-foreground/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Pincode</Label>
                    <Input 
                      value={addressParts.pincode}
                      onChange={(e) => setAddressParts({ ...addressParts, pincode: e.target.value })}
                      placeholder="600001"
                      maxLength={6}
                      className="h-11 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="space-y-6">
          <Card className="border-none shadow-xl bg-surface/50 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-foreground/5 border-b border-border">
              <CardTitle className="flex items-center gap-2"><Wallet className="text-brand" /> Bank Details</CardTitle>
              <CardDescription>Add your bank account details for invoice payments.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input 
                    value={settings.bank_details?.bank_name}
                    onChange={(e) => setSettings({ ...settings, bank_details: { ...settings.bank_details, bank_name: e.target.value } })}
                    className="h-12 rounded-xl border-border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input 
                    value={settings.bank_details?.account_no}
                    onChange={(e) => setSettings({ ...settings, bank_details: { ...settings.bank_details, account_no: e.target.value } })}
                    className="h-12 rounded-xl border-border bg-background font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input 
                    value={settings.bank_details?.ifsc}
                    onChange={(e) => setSettings({ ...settings, bank_details: { ...settings.bank_details, ifsc: e.target.value } })}
                    className="h-12 rounded-xl border-border bg-background font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input 
                    value={settings.bank_details?.branch}
                    onChange={(e) => setSettings({ ...settings, bank_details: { ...settings.bank_details, branch: e.target.value } })}
                    className="h-12 rounded-xl border-border bg-background"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="space-y-6">
          <Card className="border-none shadow-xl bg-surface/50 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-foreground/5 border-b border-border">
              <CardTitle className="flex items-center gap-2"><FileText className="text-brand" /> Invoice Preferences</CardTitle>
              <CardDescription>Configure numbering and appearance.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input 
                    value={settings.invoice_prefix}
                    onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                    className="h-12 rounded-xl border-border bg-background font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next Invoice Number</Label>
                  <Input 
                    type="number"
                    value={settings.next_invoice_number}
                    onChange={(e) => setSettings({ ...settings, next_invoice_number: Number(e.target.value) })}
                    className="h-12 rounded-xl border-border bg-background font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}

