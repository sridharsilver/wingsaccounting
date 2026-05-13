import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Globe,
  Database
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  whatsapp_number: string;
  whatsapp_message: string;
  studio_address: string;
  contact_phone: string;
  contact_email: string;
  working_hours: string;
  social_instagram: string;
  social_facebook: string;
  social_linkedin: string;
  social_twitter: string;
}

const VISIBILITY_GROUPS = [
  {
    id: 'global',
    label: 'Global Features',
    icon: Globe,
    items: [
      { id: 'show_chatbot', label: 'AI Chatbot', description: 'Show/hide the AI concierge bot on all pages', icon: MessageSquare },
    ]
  },
  {
    id: 'home',
    label: 'Home Page Sections',
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
    label: 'Contact Page Features',
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
    whatsapp_message: "Hi Wings Design Studio! I'm interested in your services.",
    studio_address: 'SRT 12, Sanath Nagar, Hyderabad, TS 500018',
    contact_phone: '+91 9951979988',
    contact_email: 'hello@wingsgraphics.in',
    working_hours: 'Mon–Sat · 10:00 — 19:00',
    social_instagram: 'https://instagram.com/wingsgraphics',
    social_facebook: 'https://facebook.com/wingsgraphics',
    social_linkedin: 'https://linkedin.com/company/wingsgraphics',
    social_twitter: 'https://twitter.com/wingsgraphics',
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
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Site Settings</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Manage global visibility and site information.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {saveStatus === 'success' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-green-600 dark:text-green-400 text-[10px] md:text-sm font-bold bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20"
            >
              <CheckCircle2 size={12} className="md:size-3.5" />
              Saved
            </motion.div>
          )}
          {/* ... error status remains same ... */}
        </div>
      </div>

      <Tabs defaultValue="visibility" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 md:mb-8 bg-surface/50 p-1 rounded-xl md:rounded-2xl border border-border/50">
          <TabsTrigger value="visibility" className="rounded-lg md:rounded-xl flex items-center gap-2 text-xs md:text-sm data-[state=active]:bg-background">
            <Eye size={14} className="md:size-4" />
            Visibility
          </TabsTrigger>
          <TabsTrigger value="data" className="rounded-lg md:rounded-xl flex items-center gap-2 text-xs md:text-sm data-[state=active]:bg-background">
            <Database size={14} className="md:size-4" />
            Site Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visibility" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-xl bg-surface/50 backdrop-blur-xl overflow-hidden rounded-2xl md:rounded-3xl">
                <CardHeader className="p-5 md:p-6 pb-0 md:pb-0">
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <Eye size={18} className="text-primary" />
                    Frontend Visibility
                  </CardTitle>
                  <CardDescription className="text-[11px] md:text-sm">Toggle major website components on or off.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-6 md:pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {VISIBILITY_GROUPS.map((group) => (
                      <AccordionItem key={group.id} value={group.id} className="border-b-0 mb-3 md:mb-4 bg-foreground/5 rounded-xl md:rounded-2xl overflow-hidden">
                        <AccordionTrigger className="px-4 md:px-6 py-3.5 md:py-4 hover:no-underline hover:bg-foreground/5 transition-colors group">
                          <div className="flex items-center gap-3 text-left">
                            <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-background text-primary">
                              <group.icon size={16} className="md:size-[18px]" />
                            </div>
                            <span className="font-bold text-sm md:text-base">{group.label}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 md:px-6 pb-4 pt-1">
                          <div className="space-y-3 md:space-y-4">
                            {group.items.map((item) => {
                              const isVisible = settings[item.id as keyof VisibilitySettings];
                              return (
                                <div 
                                  key={item.id} 
                                  className={cn(
                                    "flex items-center justify-between py-2.5 md:py-3 rounded-lg md:rounded-xl px-3 md:px-4 transition-all duration-300",
                                    isVisible ? "bg-background shadow-sm border border-border/30" : "bg-transparent opacity-60"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-1.5 md:p-2 rounded-lg transition-all duration-500",
                                      isVisible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                      <item.icon size={16} className="md:size-[18px]" />
                                    </div>
                                    <div>
                                      <p className="text-xs md:text-sm font-bold tracking-tight">{item.label}</p>
                                      <p className="text-[9px] md:text-[10px] text-muted-foreground leading-tight">{item.description}</p>
                                    </div>
                                  </div>
                                  <Switch 
                                    checked={isVisible}
                                    onCheckedChange={() => handleToggle(item.id as keyof VisibilitySettings)}
                                    className="data-[state=checked]:bg-primary scale-75 md:scale-90"
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
            {/* Quick Info card hidden on mobile or shown at bottom */}
            <div className="space-y-6">
              <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-purple-500/5 backdrop-blur-xl rounded-2xl md:rounded-3xl">
                <CardHeader className="p-5 md:p-6">
                  <CardTitle className="text-base md:text-lg">Visibility Tips</CardTitle>
                </CardHeader>
                <CardContent className="p-5 md:p-6 pt-0 md:pt-0 text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Hiding sections can help you clean up the page during maintenance or if a specific feature is temporarily unavailable.
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-xl bg-surface/50 backdrop-blur-xl rounded-2xl md:rounded-3xl">
                <CardHeader className="p-5 md:p-6">
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <Database size={18} className="text-primary" />
                    Site Information
                  </CardTitle>
                  <CardDescription className="text-[11px] md:text-sm">Update contact details and site-wide data.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6 md:space-y-8">
                  {/* WhatsApp Group */}
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-xs md:text-sm font-bold flex items-center gap-2 text-primary px-1">
                      <MessageSquare size={14} className="md:size-4" />
                      WhatsApp Business
                    </h3>
                    <div className="grid gap-5 md:gap-6 p-4 md:p-6 rounded-xl md:rounded-2xl bg-foreground/5 border border-border/50">
                      <div className="space-y-2">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="whatsapp_number" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">WhatsApp Number</Label>
                          <p className="text-[10px] text-muted-foreground italic">10-digit numbers default to +91 (India). E.g., 9951979988</p>
                        </div>
                        <Input 
                          id="whatsapp_number"
                          value={settings.whatsapp_number}
                          onChange={(e) => handleValueChange('whatsapp_number', e.target.value)}
                          onBlur={handleSave}
                          className="h-10 md:h-11 rounded-lg md:rounded-xl border-none bg-background focus-visible:ring-1 ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp_message" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Default Message</Label>
                        <Textarea 
                          id="whatsapp_message"
                          value={settings.whatsapp_message}
                          onChange={(e) => handleValueChange('whatsapp_message', e.target.value)}
                          onBlur={handleSave}
                          className="rounded-lg md:rounded-xl border-none bg-background focus-visible:ring-1 ring-primary min-h-[80px] md:min-h-[100px] resize-none text-xs md:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Group */}
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-xs md:text-sm font-bold flex items-center gap-2 text-primary px-1">
                      <PhoneIcon size={14} className="md:size-4" />
                      Contact Details
                    </h3>
                    <div className="grid gap-5 md:gap-6 p-4 md:p-6 rounded-xl md:rounded-2xl bg-foreground/5 border border-border/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact_phone" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Studio Phone</Label>
                          <Input 
                            id="contact_phone"
                            value={settings.contact_phone}
                            onChange={(e) => handleValueChange('contact_phone', e.target.value)}
                            onBlur={handleSave}
                            className="h-10 md:h-11 rounded-lg md:rounded-xl border-none bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_email" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Studio Email</Label>
                          <Input 
                            id="contact_email"
                            value={settings.contact_email}
                            onChange={(e) => handleValueChange('contact_email', e.target.value)}
                            onBlur={handleSave}
                            className="h-10 md:h-11 rounded-lg md:rounded-xl border-none bg-background"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studio_address" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Studio Address</Label>
                        <Input 
                          id="studio_address"
                          value={settings.studio_address}
                          onChange={(e) => handleValueChange('studio_address', e.target.value)}
                          onBlur={handleSave}
                          className="h-10 md:h-11 rounded-lg md:rounded-xl border-none bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="working_hours" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Working Hours</Label>
                        <Input 
                          id="working_hours"
                          value={settings.working_hours}
                          onChange={(e) => handleValueChange('working_hours', e.target.value)}
                          onBlur={handleSave}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Social Media Group */}
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-xs md:text-sm font-bold flex items-center gap-2 text-primary px-1">
                      <Globe size={14} className="md:size-4" />
                      Social Media Links
                    </h3>
                    <div className="grid gap-5 md:gap-6 p-4 md:p-6 rounded-xl md:rounded-2xl bg-foreground/5 border border-border/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="social_instagram" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Instagram</Label>
                          <Input 
                            id="social_instagram"
                            value={settings.social_instagram}
                            onChange={(e) => handleValueChange('social_instagram', e.target.value)}
                            onBlur={handleSave}
                            placeholder="https://instagram.com/..."
                            className="h-10 md:h-11 rounded-lg md:rounded-xl border-none bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_facebook" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Facebook</Label>
                          <Input 
                            id="social_facebook"
                            value={settings.social_facebook}
                            onChange={(e) => handleValueChange('social_facebook', e.target.value)}
                            onBlur={handleSave}
                            placeholder="https://facebook.com/..."
                            className="h-10 md:h-11 rounded-lg md:rounded-xl border-none bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_linkedin" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">LinkedIn</Label>
                          <Input 
                            id="social_linkedin"
                            value={settings.social_linkedin}
                            onChange={(e) => handleValueChange('social_linkedin', e.target.value)}
                            onBlur={handleSave}
                            placeholder="https://linkedin.com/in/..."
                            className="h-10 md:h-11 rounded-lg md:rounded-xl border-none bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_twitter" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Twitter / X</Label>
                          <Input 
                            id="social_twitter"
                            value={settings.social_twitter}
                            onChange={(e) => handleValueChange('social_twitter', e.target.value)}
                            onBlur={handleSave}
                            placeholder="https://twitter.com/..."
                            className="h-10 md:h-11 rounded-lg md:rounded-xl border-none bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="pt-4">
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full py-4 rounded-2xl bg-gradient-brand text-brand-foreground font-bold shadow-glow hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={20} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-purple-500/5 backdrop-blur-xl rounded-2xl md:rounded-3xl">
                <CardHeader className="p-5 md:p-6">
                  <CardTitle className="text-base md:text-lg">Data Management</CardTitle>
                </CardHeader>
                <CardContent className="p-5 md:p-6 pt-0 md:pt-0 text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Updates are saved automatically when you click out of an input field. Changes reflect instantly on your live website.
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
