import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { supabase } from "../lib/supabase";

const SESSION_CHECK_TIMEOUT_MS = 8000;

export default function Index() {
  const [destination, setDestination] = useState<"/home" | "/login" | null>(null);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const sessionCheck = supabase.auth.getSession()
      .then(({ data, error }) => (!error && data.session ? "/home" : "/login") as const)
      .catch(() => "/login" as const);

    const timeoutFallback = new Promise<"/login">((resolve) => {
      timeout = setTimeout(() => resolve("/login"), SESSION_CHECK_TIMEOUT_MS);
    });

    Promise.race([sessionCheck, timeoutFallback])
      .then((nextDestination) => {
        if (active) setDestination(nextDestination);
      })
      .finally(() => {
        if (timeout) clearTimeout(timeout);
      });

    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (destination) return <Redirect href={destination} />;
  return <View style={styles.loading}><ActivityIndicator size="large" color="#e53935" /></View>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
});
