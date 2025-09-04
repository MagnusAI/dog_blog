// Edge Function for managing authenticated sessions to hundeweb.dk
// Handles login and stores session cookies in Supabase for other functions to use
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SessionRecord {
  id?: string;
  session_id: string;
  cookies: string;
  created_at?: string;
  expires_at: string;
  is_active: boolean;
  login_method: 'CAS' | 'STANDARD';
}

interface SessionResponse {
  success: boolean;
  sessionId?: string;
  expiresAt?: string;
  error?: string;
  loginMethod?: 'CAS' | 'STANDARD';
}

class HundewebAuthenticator {
  private username: string;
  private password: string;
  private loginUrl: string;
  private cookies: string;
  private supabase: any;

  constructor(username: string, password: string, supabaseUrl: string, supabaseKey: string) {
    this.username = username;
    this.password = password;
    this.loginUrl = "https://www.hundeweb.dk/dkk/secure/openIndex?ARTICLE_ID=6";
    this.cookies = "";
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async createSession(): Promise<SessionResponse> {
    try {
      console.log("Starting authentication process...");
      
      // First check if we have a valid existing session
      const existingSession = await this.getValidExistingSession();
      if (existingSession) {
        console.log("Found valid existing session, reusing it");
        return {
          success: true,
          sessionId: existingSession.session_id,
          expiresAt: existingSession.expires_at,
          loginMethod: existingSession.login_method
        };
      }

      // No valid session exists, create new one
      const loginResult = await this.performLogin();
      if (!loginResult.success) {
        return {
          success: false,
          error: loginResult.error
        };
      }

      // Store the new session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      
      const sessionRecord: SessionRecord = {
        session_id: sessionId,
        cookies: this.cookies,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        login_method: loginResult.method
      };

      const { error: insertError } = await this.supabase
        .from('scraper_sessions')
        .insert(sessionRecord);

      if (insertError) {
        console.error("Failed to store session:", insertError);
        return {
          success: false,
          error: `Failed to store session: ${insertError.message}`
        };
      }

      console.log(`Session created successfully: ${sessionId}, expires: ${expiresAt.toISOString()}`);
      
      return {
        success: true,
        sessionId: sessionId,
        expiresAt: expiresAt.toISOString(),
        loginMethod: loginResult.method
      };

    } catch (error) {
      console.error("Session creation error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async getValidExistingSession(): Promise<SessionRecord | null> {
    try {
      const { data: session, error } = await this.supabase
        .from('scraper_sessions')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error("Error checking existing sessions:", error);
        return null;
      }

      return session;
    } catch (error) {
      console.error("Error checking existing sessions:", error);
      return null;
    }
  }

  private async performLogin(): Promise<{ success: boolean; error?: string; method: 'CAS' | 'STANDARD' }> {
    try {
      console.log("Starting login process...");
      
      // Get the login page to determine authentication method
      const loginPageResponse = await fetch(this.loginUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });

      if (!loginPageResponse.ok) {
        throw new Error(`Failed to load login page: ${loginPageResponse.status}`);
      }

      // Extract initial cookies
      const setCookieHeaders = loginPageResponse.headers.get("set-cookie");
      if (setCookieHeaders) {
        this.cookies = setCookieHeaders.split(',').map(cookie => cookie.split(';')[0]).join('; ');
      }

      const loginPageHtml = await loginPageResponse.text();

      // Determine authentication method
      if (loginPageHtml.includes('cas/login') || loginPageResponse.url.includes('cas/login')) {
        console.log("Detected CAS authentication system");
        const success = await this.handleCASLogin();
        return { success, method: 'CAS' };
      } else {
        console.log("Using standard authentication");
        const success = await this.handleStandardLogin(loginPageHtml);
        return { success, method: 'STANDARD' };
      }

    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message, method: 'STANDARD' };
    }
  }

  private async handleCASLogin(): Promise<boolean> {
    try {
      const casLoginUrl = "https://www.hundeweb.dk/cas/login?locale=da&service=https%3A%2F%2Fwww.hundeweb.dk%2Fdkk-hundedatabase-backend%2Flogin%2Fcas";
      
      const casPageResponse = await fetch(casLoginUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Cookie": this.cookies
        }
      });

      // Update cookies from CAS page
      const casSetCookieHeaders = casPageResponse.headers.get("set-cookie");
      if (casSetCookieHeaders) {
        const newCookies = casSetCookieHeaders.split(',').map(cookie => cookie.split(';')[0]).join('; ');
        this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies;
      }

      const casPageHtml = await casPageResponse.text();

      // Extract form data
      const actionMatch = casPageHtml.match(/<form[^>]*action="([^"]+)"/i);
      const formAction = actionMatch ? actionMatch[1] : "/cas/login";

      // Extract hidden fields
      const hiddenFields: Record<string, string> = {};
      const hiddenMatches = casPageHtml.matchAll(/<input[^>]*type="hidden"[^>]*name="([^"]+)"[^>]*value="([^"]*)"[^>]*>/gi);
      for (const match of hiddenMatches) {
        hiddenFields[match[1]] = match[2];
      }

      // Get field names
      const usernameMatch = casPageHtml.match(/<input[^>]*name="([^"]*username[^"]*)"[^>]*/i) || 
                           casPageHtml.match(/<input[^>]*name="([^"]*user[^"]*)"[^>]*/i);
      const passwordMatch = casPageHtml.match(/<input[^>]*name="([^"]*password[^"]*)"[^>]*/i);
      
      const usernameField = usernameMatch ? usernameMatch[1] : 'username';
      const passwordField = passwordMatch ? passwordMatch[1] : 'password';

      // Prepare login data
      const casLoginData = new URLSearchParams({
        ...hiddenFields,
        [usernameField]: this.username,
        [passwordField]: this.password
      });

      // Submit login
      const casSubmitUrl = formAction.startsWith('http') ? formAction : `https://www.hundeweb.dk${formAction}`;
      const casLoginResponse = await fetch(casSubmitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": casLoginUrl,
          "Cookie": this.cookies
        },
        body: casLoginData.toString(),
        redirect: "manual"
      });

      // Update cookies from login response
      const casLoginSetCookieHeaders = casLoginResponse.headers.get("set-cookie");
      if (casLoginSetCookieHeaders) {
        const newCookies = casLoginSetCookieHeaders.split(',').map(cookie => cookie.split(';')[0]).join('; ');
        this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies;
      }

      // Handle redirect
      if (casLoginResponse.status === 302) {
        const location = casLoginResponse.headers.get('location');
        if (location) {
          const finalResponse = await fetch(location, {
            method: "GET",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              "Cookie": this.cookies
            },
            redirect: "manual"
          });

          const finalSetCookieHeaders = finalResponse.headers.get("set-cookie");
          if (finalSetCookieHeaders) {
            const newCookies = finalSetCookieHeaders.split(',').map(cookie => cookie.split(';')[0]).join('; ');
            this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies;
          }
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error("CAS login error:", error);
      return false;
    }
  }

  private async handleStandardLogin(loginPageHtml: string): Promise<boolean> {
    try {
      const actionMatch = loginPageHtml.match(/action="([^"]+)"/);
      const formAction = actionMatch ? actionMatch[1] : "/dkk/secure/openIndex";

      const hiddenFields: Record<string, string> = {};
      const hiddenMatches = loginPageHtml.matchAll(/<input[^>]*type="hidden"[^>]*name="([^"]+)"[^>]*value="([^"]*)"[^>]*>/gi);
      for (const match of hiddenMatches) {
        hiddenFields[match[1]] = match[2];
      }

      const loginData = new URLSearchParams({
        ...hiddenFields,
        username: this.username,
        password: this.password,
        login: "Login",
        submit: "Login"
      });

      const loginResponse = await fetch(`https://www.hundeweb.dk${formAction}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": this.loginUrl,
          "Cookie": this.cookies
        },
        body: loginData.toString(),
        redirect: "manual"
      });

      const newSetCookieHeaders = loginResponse.headers.get("set-cookie");
      if (newSetCookieHeaders) {
        const newCookies = newSetCookieHeaders.split(',').map(cookie => cookie.split(';')[0]).join('; ');
        this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies;
      }

      return loginResponse.status === 302 || loginResponse.status === 200;
    } catch (error) {
      console.error("Standard login error:", error);
      return false;
    }
  }

  // Method to invalidate sessions (cleanup)
  async invalidateExpiredSessions(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('scraper_sessions')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error("Error invalidating expired sessions:", error);
      } else {
        console.log("Expired sessions invalidated");
      }
    } catch (error) {
      console.error("Error during session cleanup:", error);
    }
  }
}

serve(async (req) => {
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get credentials from environment variables
    // @ts-ignore
    const username = Deno.env.get('HUNDEWEB_USERNAME');
    // @ts-ignore
    const password = Deno.env.get('HUNDEWEB_PASSWORD');
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!username || !password || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        error: 'Server configuration error: Missing required environment variables',
        success: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const cleanup = url.searchParams.get('cleanup') === 'true';

    const authenticator = new HundewebAuthenticator(username, password, supabaseUrl, supabaseServiceKey);

    // Handle cleanup request
    if (cleanup) {
      await authenticator.invalidateExpiredSessions();
      return new Response(JSON.stringify({
        success: true,
        message: 'Expired sessions cleaned up'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create or retrieve session
    const result = await authenticator.createSession();

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
