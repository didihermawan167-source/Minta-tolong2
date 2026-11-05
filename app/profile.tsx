import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

type SkillCategory = { id: string; name: string };

export default function Profile() {
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!auth.user) {
          router.replace("/login");
          return;
        }
        const current = { id: auth.user.id, email: auth.user.email, name: String(auth.user.user_metadata?.display_name || "Pengguna") };
        const [categoryResult, profileResult, skillResult] = await Promise.all([
          supabase.from("skill_categories").select("id,name").eq("is_active", true).order("name"),
          supabase.from("user_profiles").select("bio,city,is_provider,display_name").eq("id", auth.user.id).maybeSingle(),
          supabase.from("provider_skills").select("category_id").eq("user_id", auth.user.id),
        ]);
        if (categoryResult.error) throw categoryResult.error;
        if (profileResult.error) throw profileResult.error;
        if (skillResult.error) throw skillResult.error;
        if (!active) return;
        setUser({ ...current, name: profileResult.data?.display_name || current.name });
        setCategories(categoryResult.data || []);
        setBio(profileResult.data?.bio || "");
        setCity(profileResult.data?.city || "");
        setSelected((skillResult.data || []).map((x: {category_id:string}) => x.category_id));
      } catch (e) {
        if (active) Alert.alert("Gagal memuat profil", e instanceof Error ? e.message : "Periksa koneksi dan database.");
      } finally {
        if (active) setBusy(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("save_provider_profile", {
        p_display_name: user.name || "Pengguna",
        p_bio: bio.trim(),
        p_city: city.trim(),
        p_category_ids: selected,
      });
      if (error) throw error;
      Alert.alert("Tersimpan", "Profil dan keterampilan penyedia bantuan berhasil disimpan.");
    } catch (e) {
      Alert.alert("Belum tersimpan", e instanceof Error ? e.message : "Periksa koneksi, migrasi database, dan izin akun.");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => Alert.alert("Keluar", "Yakin ingin keluar?", [
    { text: "Batal", style: "cancel" },
    { text: "Keluar", style: "destructive", onPress: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert("Gagal keluar", error.message);
      else router.replace("/login");
    }},
  ]);

  if (busy) return <View style={s.center}><ActivityIndicator size="large" /><Text>Memuat profil...</Text></View>;

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.avatar}>👤</Text>
      <Text style={s.name}>{user?.name || "Pengguna"}</Text>
      <Text style={s.email}>{user?.email || ""}</Text>
      <View style={s.card}>
        <Text style={s.heading}>Profil pemberi bantuan (opsional)</Text>
        <Text style={s.hint}>Gunakan akun yang sama untuk meminta bantuan dan menawarkan keterampilan.</Text>
        <TextInput style={s.input} placeholder="Kota / wilayah" value={city} onChangeText={setCity} />
        <TextInput style={[s.input, s.bio]} placeholder="Ceritakan pengalaman atau bantuan yang bisa diberikan" value={bio} onChangeText={setBio} multiline />
        <Text style={s.heading}>Pilih keterampilan</Text>
        {categories.length === 0 ? <Text style={s.hint}>Kategori belum tersedia. Pastikan migrasi database sudah diterapkan.</Text> : categories.map((item) => {
          const active = selected.includes(item.id);
          return <Pressable key={item.id} style={[s.category, active && s.categoryActive]} onPress={() => toggle(item.id)}>
            <Text style={active ? s.categoryTextActive : s.categoryText}>{active ? "✓  " : "○  "}{item.name}</Text>
          </Pressable>;
        })}
        <Pressable style={[s.save, saving && s.disabled]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Simpan profil keterampilan</Text>}
        </Pressable>
      </View>
      <Pressable style={s.btn} onPress={() => router.push("/history")}><Text>📋  Riwayat bantuan</Text></Pressable>
      <Pressable style={s.btn} onPress={() => router.replace("/home")}><Text>🏠  Kembali ke beranda</Text></Pressable>
      <Pressable style={s.out} onPress={logout}><Text style={{ color: "#e53935", fontWeight: "700" }}>Keluar</Text></Pressable>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: "#fff" },
  wrap: { padding: 22, alignItems: "center", backgroundColor: "#fff", paddingBottom: 40 },
  avatar: { fontSize: 64, marginTop: 24 },
  name: { fontSize: 24, fontWeight: "800", marginTop: 8 },
  email: { color: "#777", marginTop: 4, marginBottom: 18 },
  card: { width: "100%", backgroundColor: "#f7f7f7", padding: 16, borderRadius: 15, marginBottom: 18 },
  heading: { fontSize: 17, fontWeight: "800", marginBottom: 8 },
  hint: { color: "#666", marginBottom: 12, lineHeight: 20 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 10 },
  bio: { minHeight: 76, textAlignVertical: "top" },
  category: { padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, marginBottom: 8, backgroundColor: "#fff" },
  categoryActive: { borderColor: "#e53935", backgroundColor: "#fff0f0" },
  categoryText: { color: "#333" },
  categoryTextActive: { color: "#c62828", fontWeight: "700" },
  save: { backgroundColor: "#e53935", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 10 },
  disabled: { opacity: 0.6 },
  saveText: { color: "#fff", fontWeight: "800" },
  btn: { width: "100%", padding: 16, borderWidth: 1, borderColor: "#ddd", borderRadius: 12, alignItems: "center", marginBottom: 10 },
  out: { marginTop: 8, padding: 14 },
});
