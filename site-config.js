// Site settings — edit, then redeploy. These values are safe to be public.
window.PA_CONFIG = {
  // Annie's WhatsApp number in international format, digits only (852 + 8-digit number), e.g. "85291234567".
  whatsappNumber: "",
  // true once ANTHROPIC_API_KEY is set in Netlify; false hides photo reading.
  photoReading: false,
  // true once QWEN_API_KEY or OPENROUTER_API_KEY is set in Netlify; false hides the AI preview tab.
  aiPreview: false,
  // Client sign-in, PDF emails, account page and CRM (Supabase → Project Settings → API).
  // Leave blank to run without sign-in: the WhatsApp button still works, and account/admin pages show a demo.
  supabaseUrl: "",      // e.g. "https://abcdefgh.supabase.co"
  supabaseAnonKey: "",  // the "anon public" key (NOT the service_role key)
};
