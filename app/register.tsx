import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !pass) {
      Alert.alert("Lengkapi", "Nama, email, dan password wajib diisi.");
      return;
    }
    if (pass.length < 6) {
      Alert.alert("Password terlalu pendek", "Gunakan minimal 6 karakter.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: { data: { display_name: cleanName } },
      });
      if (error) throw error;
      if (data.session) {
        router.replace("/home");
      } else {
        Alert.alert("Pendaftaran diterima", "Periksa email untuk konfirmasi akun, lalu masuk.");
        router.replace("/login");
      }
    } catch (e) {
      Alert.alert("Pendaftaran gagal", e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Buat Akun</Text>
      <Text style={s.sub}>Satu akun untuk meminta maupun memberikan bantuan.</Text>
      <TextInput style={s.input} placeholder="Nama" value={name} onChangeText={setName} autoCapitalize="words" />
      <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={s.input} placeholder="Password (minimal 6 karakter)" value={pass} onChangeText={setPass} secureTextEntry />
      <Pressable style={[s.btn, busy && s.disabled]} onPress={go} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.bt}>Daftar</Text>}
      </Pressable>
      <Pressable onPress={() => router.replace("/login")}><Text style={s.link}>Sudah punya akun? Masuk</Text></Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  sub: { color: "#666", textAlign: "center", marginBottom: 22 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 14, marginBottom: 12 },
  btn: { backgroundColor: "#e53935", padding: 15, borderRadius: 12, alignItems: "center" },
  disabled: { opacity: 0.6 },
  bt: { color: "#fff", fontWeight: "700" },
  link: { textAlign: "center", marginTop: 18, color: "#e53935" },
});
