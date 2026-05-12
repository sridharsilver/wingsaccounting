import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Settings, 
  MessageSquare, 
  Image as ImageIcon, 
  Briefcase, 
  FileText, 
  Users, 
  Star, 
  Eye, 
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Map as MapIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettingsPage,
})

interface VisibilitySettings {
  show_chatbot: boolean;
  show_portfolio: boolean;
  show_services: boolean;
  show_blog: boolean;
  show_team: boolean;
  show_testimonials: boolean;
  show_enquiry_form: boolean;
  show_contact_map: boolean;
}

const SETTING_GROUPS = [
  {
    id: 'global',
    label: 'Global & AI',
    icon: Settings,
    items: [
      { id: 'show_chatbot', label: 'AI Chatbot', description: 'Show/hide the AI concierge bot on all pages', icon: MessageSquare },
    ]
  },
  {
    id: 'home',
    label: 'Home Page',
    icon: HomeIcon,
    items: [
      { id: 'show_portfolio', label: 'Portfolio Section', description: 'Display your creative work gallery', icon: ImageIcon },
      { id: 'show_services', label: 'Services Section', description: 'List of professional services offered', icon: Briefcase },
      { id: 'show_blog', label: 'Blog / News', description: 'Latest articles and studio updates', icon: FileText },
      { id: 'show_team', label: 'Team Section', description: 'Showcase your talented team members', icon: Users },
      { id: 'show_testimonials', label: 'Testimonials', description: 'Client reviews and feedback section', icon: Star },
    ]
  },
  {
    id: 'contact',
    label: 'Contact Page',
    icon: PhoneIcon,
    items: [
      { id: 'show_enquiry_form', label: 'Enquiry Forms', description: 'Allow users to send business enquiries', icon: MessageSquare },
      { id: 'show_contact_map', label: 'Google Map', description: 'Show/hide the studio location map', icon: MapIcon },
    ]
  }
];

function AdminSettingsPage() {
  const [settings, setSettings] = useState<VisibilitySettings>({
    show_chatbot: true,
    show_portfolio: true,
    show_services: true,
    show_blog: true,
    show_team: true,
    show_testimonials: true,
    show_enquiry_form: true,
    show_contact_map: true,
    whatsapp_number: '919951979988',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'frontend_visibility')
        .maybeSingle();

      if (error) {
        throw error;
      } else if (data?.value) {
        setSettings(data.value as VisibilitySettings);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggle(id: keyof VisibilitySettings) {
    const newSettings = { ...settings, [id]: !settings[id] };
    setSettings(newSettings);
    await saveSettings(newSettings);
  }

  async function handleValueChange(id: keyof VisibilitySettings, value: string) {
    const newSettings = { ...settings, [id]: value };
    setSettings(newSettings);
  }

  async function handleSave() {
    await saveSettings(settings);
  }

  async function saveSettings(settingsToSave: VisibilitySettings) {
    try {
      setIsSaving(true);
      setSaveStatus('idle');
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'frontend_visibility', 
          value: settingsToSave,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading site preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
          <p className="text-muted-foreground mt-1">Manage global visibility and frontend feature toggles.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {saveStatus === 'success' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-bold bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20"
            >
              <CheckCircle2 size={14} />
              Saved
            </motion.div>
          )}
          {saveStatus === 'error' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-bold bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20"
            >
              <AlertCircle size={14} />
              Save Failed
            </motion.div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-xl bg-surface/50 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2 text-primary">
                <Eye size={20} />
                <CardTitle className="text-xl">Frontend Visibility</CardTitle>
              </div>
              <CardDescription>Control which sections are visible to your visitors.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="multiple" defaultValue={["global", "home"]} className="w-full">
                {SETTING_GROUPS.map((group) => (
                  <AccordionItem key={group.id} value={group.id} className="border-b-0 mb-4 bg-foreground/5 rounded-2xl overflow-hidden">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-foreground/5 transition-colors group">
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 rounded-xl bg-background text-primary">
                          <group.icon size={18} />
                        </div>
                        <span className="font-bold text-base">{group.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 pt-2">
                      <div className="space-y-4">
                        {group.id === 'global' && (
                          <div className="mb-6 p-4 rounded-xl bg-background border border-border/50 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="whatsapp_number" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">WhatsApp Contact Number</Label>
                              <div className="flex gap-2">
                                <Input 
                                  id="whatsapp_number"
                                  value={settings.whatsapp_number}
                                  onChange={(e) => handleValueChange('whatsapp_number', e.target.value)}
                                  onBlur={handleSave}
                                  placeholder="e.g. 919951979988"
                                  className="rounded-xl border-none bg-foreground/5 focus-visible:ring-primary"
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground italic">Include country code without + (e.g. 91 for India)</p>
                            </div>
                          </div>
                        )}
                        {group.items.map((item) => {
                          const isVisible = settings[item.id as keyof VisibilitySettings];
                          return (
                            <div 
                              key={item.id} 
                              className={cn(
                                "flex items-center justify-between py-3 rounded-xl px-4 transition-all duration-300",
                                isVisible ? "bg-background shadow-sm border border-border/50" : "bg-transparent opacity-60"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg transition-all duration-500",
                                  isVisible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                  <item.icon size={18} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold tracking-tight">{item.label}</p>
                                  <p className="text-[10px] text-muted-foreground leading-tight">{item.description}</p>
                                </div>
                              </div>
                              <Switch 
                                checked={isVisible}
                                onCheckedChange={() => handleToggle(item.id as keyof VisibilitySettings)}
                                className="data-[state=checked]:bg-primary scale-90"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-purple-500/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings size={18} />
                Quick Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Grouped settings allow you to manage your studio website with precision.
              </p>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                <strong>Tip:</strong> You can hide the map if you are working remotely or shifting locations.
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                <strong>Real-time:</strong> All changes are applied instantly to the live site.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
