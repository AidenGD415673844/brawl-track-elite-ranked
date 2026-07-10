export function getBackendConfigStatus() {
  const hasUrl = Boolean(import.meta.env.VITE_SUPABASE_URL);
  const hasKey = Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

  if (!hasUrl || !hasKey) {
    return {
      state: "missing-config",
      label: "Backend config missing",
      detail: "This deployed build is missing backend environment values.",
      ready: false,
    };
  }

  return {
    state: "configured",
    label: "Backend configured",
    detail: "Backend environment values are present in this build.",
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