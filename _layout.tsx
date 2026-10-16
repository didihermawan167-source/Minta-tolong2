import { Stack, ErrorBoundaryProps } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minta Tolong mengalami kesalahan</Text>
      <Text style={styles.message}>{error.message}</Text>
      <Pressable style={styles.button} onPress={retry}>
        <Text style={styles.buttonText}>Coba Lagi</Text>
      </Pressable>
    </View>
  );
}

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    color: "#b00020",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#e53935",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
