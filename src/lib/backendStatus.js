export function getBackendConfigStatus() {
  // The Supabase client now has permanent inline fallbacks for URL + anon key,
  // so config is always present. Env vars still override at build time.
  return {
    state: "configured",
    label: "Backend configured",
    detail: "Backend client is initialised.",
    ready: true,
  };
}

export async function probeBackendFunction(functionName, body = {}) {
  const config = getBackendConfigStatus();
  if (!config.ready) return config;

  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.functions.invoke(functionName, { body });

    if (!error) {
      return {
        state: "ready",
        label: "Backend ready",
        detail: "Backend functions are reachable.",
        ready: true,
      };
    }

    if (error.message?.toLowerCase().includes("unauthorized") || error.context?.status === 401) {
      return {
        state: "auth-required",
        label: "Auth required",
        detail: "Backend is reachable, but this function requires a signed-in session.",
        ready: false,
      };
    }

    return {
      state: "function-error",
      label: "Function unavailable",
      detail: error.message || "Backend function did not respond successfully.",
      ready: false,
    };
  } catch (err) {
    return {
      state: "client-error",
      label: "Backend unavailable",
      detail: err?.message || "Could not initialize the backend client.",
      ready: false,
    };
  }
}