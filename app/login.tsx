import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { setItem } from "../lib/storage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) {
      Alert.alert("Lengkapi", "Email dan password wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });
      if (error) throw error;
      if (!data.session || !data.user) {
        throw new Error("Sesi masuk belum terbentuk. Silakan coba lagi.");
      }
      const name = String(data.user.user_metadata?.full_name || cleanEmail.split("@")[0]);
      await setItem("user", JSON.stringify({ name, email: data.user.email || cleanEmail }));
      router.replace("/home");
    } catch (error) {
      Alert.alert("Gagal masuk", error instanceof Error ? error.message : "Periksa koneksi internet lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.logo}>🆘</Text><Text style={s.title}>Minta Tolong</Text>
      <Text style={s.sub}>Bantu orang lain, dan jangan ragu meminta bantuan.</Text>
      <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <TextInput style={s.input} placeholder="Password" value={pass} onChangeText={setPass} secureTextEntry autoComplete="password" />
      <Pressable style={[s.btn, loading && s.disabled]} onPress={go} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>Masuk</Text>}
      </Pressable>
      <Pressable onPress={() => router.push("/register")} disabled={loading}><Text style={s.link}>Belum punya akun? Daftar</Text></Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  logo: { fontSize: 58, textAlign: "center" }, title: { fontSize: 30, fontWeight: "800", textAlign: "center", marginTop: 8 },
  sub: { textAlign: "center", color: "#666", marginBottom: 28 }, input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: "#e53935", padding: 15, borderRadius: 12, alignItems: "center", minHeight: 52, justifyContent: "center" }, disabled: { opacity: 0.65 }, btnT: { color: "#fff", fontWeight: "700", fontSize: 17 },
  link: { textAlign: "center", color: "#e53935", marginTop: 18, fontWeight: "600" }
});
