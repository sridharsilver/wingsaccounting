import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface VisibilitySettings {
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
}

const DEFAULT_SETTINGS: VisibilitySettings = {
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
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<VisibilitySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'frontend_visibility')
          .maybeSingle(); // Use maybeSingle to avoid errors on empty results

        if (error) {
          console.warn('Site settings fetch error (using defaults):', error.message);
          return;
        }

        if (data?.value) {
          setSettings(data.value as VisibilitySettings);
        }
      } catch (err) {
        console.error('Critical error fetching site settings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();

    // Subscribe to real-time changes with a unique channel name
    const channelId = `site_settings_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'site_settings',
          filter: "key=eq.frontend_visibility"
        },
        (payload) => {
          if (payload.new && (payload.new as any).value) {
            setSettings((payload.new as any).value as VisibilitySettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, loading };
}
