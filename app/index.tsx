import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { getItem } from "../lib/storage";

export default function Index() {
  const [destination, setDestination] = useState<"/home" | "/login" | null>(null);

  useEffect(() => {
    let active = true;

    getItem("loggedIn")
      .then((value) => {
        if (active) setDestination(value === "1" ? "/home" : "/login");
      })
      .catch(() => {
        if (active) setDestination("/login");
      });

    return () => {
      active = false;
    };
  }, []);

  if (destination) {
    return <Redirect href={destination} />;
  }

  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#e53935" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
