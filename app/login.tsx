import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) {
      Alert.alert("Lengkapi", "Email dan password wajib diisi.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
      if (error) throw error;
      router.replace("/home");
    } catch (e) {
      Alert.alert("Tidak bisa masuk", e instanceof Error ? e.message : "Periksa koneksi dan data akun.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.logo}>🆘</Text>
      <Text style={s.title}>Minta Tolong</Text>
      <Text style={s.sub}>Satu akun untuk meminta maupun memberikan bantuan.</Text>
      <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={s.input} placeholder="Password" value={pass} onChangeText={setPass} secureTextEntry />
      <Pressable style={[s.btn, busy && s.disabled]} onPress={go} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>Masuk</Text>}
      </Pressable>
      <Pressable onPress={() => router.push("/register")}><Text style={s.link}>Belum punya akun? Daftar</Text></Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  logo: { fontSize: 58, textAlign: "center" },
  title: { fontSize: 30, fontWeight: "800", textAlign: "center", marginTop: 8 },
  sub: { textAlign: "center", color: "#666", marginBottom: 28 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: "#e53935", padding: 15, borderRadius: 12, alignItems: "center" },
  disabled: { opacity: 0.6 },
  btnT: { color: "#fff", fontWeight: "700", fontSize: 17 },
  link: { textAlign: "center", color: "#e53935", marginTop: 18, fontWeight: "600" },
});
