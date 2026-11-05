import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !pass) {
      Alert.alert("Lengkapi", "Semua data wajib diisi.");
      return;
    }
    if (pass.length < 6) {
      Alert.alert("Password terlalu pendek", "Gunakan minimal 6 karakter.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: { data: { full_name: cleanName } },
      });
      if (error) throw error;
      if (data.session && data.user) {
        router.replace("/home");
      } else {
        Alert.alert(
          "Pendaftaran berhasil",
          "Periksa email untuk mengonfirmasi akun, lalu masuk menggunakan email dan password yang didaftarkan.",
          [{ text: "OK", onPress: () => router.replace("/login") }]
        );
      }
    } catch (error) {
      Alert.alert("Pendaftaran gagal", error instanceof Error ? error.message : "Periksa koneksi internet lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Buat Akun</Text>
      <TextInput style={s.input} placeholder="Nama" value={name} onChangeText={setName} autoCapitalize="words" />
      <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <TextInput style={s.input} placeholder="Password (minimal 6 karakter)" value={pass} onChangeText={setPass} secureTextEntry autoComplete="new-password" />
      <Pressable style={[s.btn, loading && s.disabled]} onPress={go} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.bt}>Daftar</Text>}
      </Pressable>
      <Pressable onPress={() => router.replace("/login")} disabled={loading}><Text style={s.link}>Sudah punya akun? Masuk</Text></Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 25, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 14, marginBottom: 12 },
  btn: { backgroundColor: "#e53935", padding: 15, borderRadius: 12, alignItems: "center", minHeight: 50, justifyContent: "center" },
  disabled: { opacity: 0.65 }, bt: { color: "#fff", fontWeight: "700" }, link: { textAlign: "center", marginTop: 18, color: "#e53935" }
});
